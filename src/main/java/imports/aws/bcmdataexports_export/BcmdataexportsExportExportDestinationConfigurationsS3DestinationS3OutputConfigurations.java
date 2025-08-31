package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations")
@software.amazon.jsii.Jsii.Proxy(BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations.Jsii$Proxy.class)
public interface BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#compression BcmdataexportsExport#compression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCompression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#format BcmdataexportsExport#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#output_type BcmdataexportsExport#output_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOutputType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#overwrite BcmdataexportsExport#overwrite}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOverwrite();

    /**
     * @return a {@link Builder} of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations> {
        java.lang.String compression;
        java.lang.String format;
        java.lang.String outputType;
        java.lang.String overwrite;

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations#getCompression}
         * @param compression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#compression BcmdataexportsExport#compression}. This parameter is required.
         * @return {@code this}
         */
        public Builder compression(java.lang.String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#format BcmdataexportsExport#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations#getOutputType}
         * @param outputType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#output_type BcmdataexportsExport#output_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder outputType(java.lang.String outputType) {
            this.outputType = outputType;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations#getOverwrite}
         * @param overwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#overwrite BcmdataexportsExport#overwrite}. This parameter is required.
         * @return {@code this}
         */
        public Builder overwrite(java.lang.String overwrite) {
            this.overwrite = overwrite;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations {
        private final java.lang.String compression;
        private final java.lang.String format;
        private final java.lang.String outputType;
        private final java.lang.String overwrite;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.compression = software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputType = software.amazon.jsii.Kernel.get(this, "outputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overwrite = software.amazon.jsii.Kernel.get(this, "overwrite", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.compression = java.util.Objects.requireNonNull(builder.compression, "compression is required");
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.outputType = java.util.Objects.requireNonNull(builder.outputType, "outputType is required");
            this.overwrite = java.util.Objects.requireNonNull(builder.overwrite, "overwrite is required");
        }

        @Override
        public final java.lang.String getCompression() {
            return this.compression;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getOutputType() {
            return this.outputType;
        }

        @Override
        public final java.lang.String getOverwrite() {
            return this.overwrite;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("compression", om.valueToTree(this.getCompression()));
            data.set("format", om.valueToTree(this.getFormat()));
            data.set("outputType", om.valueToTree(this.getOutputType()));
            data.set("overwrite", om.valueToTree(this.getOverwrite()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations.Jsii$Proxy that = (BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations.Jsii$Proxy) o;

            if (!compression.equals(that.compression)) return false;
            if (!format.equals(that.format)) return false;
            if (!outputType.equals(that.outputType)) return false;
            return this.overwrite.equals(that.overwrite);
        }

        @Override
        public final int hashCode() {
            int result = this.compression.hashCode();
            result = 31 * result + (this.format.hashCode());
            result = 31 * result + (this.outputType.hashCode());
            result = 31 * result + (this.overwrite.hashCode());
            return result;
        }
    }
}
