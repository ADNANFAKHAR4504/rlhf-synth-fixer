package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeLogConfigurationS3LogDestination")
@software.amazon.jsii.Jsii.Proxy(PipesPipeLogConfigurationS3LogDestination.Jsii$Proxy.class)
public interface PipesPipeLogConfigurationS3LogDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_name PipesPipe#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_owner PipesPipe#bucket_owner}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketOwner();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#output_format PipesPipe#output_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#prefix PipesPipe#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeLogConfigurationS3LogDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeLogConfigurationS3LogDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeLogConfigurationS3LogDestination> {
        java.lang.String bucketName;
        java.lang.String bucketOwner;
        java.lang.String outputFormat;
        java.lang.String prefix;

        /**
         * Sets the value of {@link PipesPipeLogConfigurationS3LogDestination#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_name PipesPipe#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfigurationS3LogDestination#getBucketOwner}
         * @param bucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_owner PipesPipe#bucket_owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketOwner(java.lang.String bucketOwner) {
            this.bucketOwner = bucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfigurationS3LogDestination#getOutputFormat}
         * @param outputFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#output_format PipesPipe#output_format}.
         * @return {@code this}
         */
        public Builder outputFormat(java.lang.String outputFormat) {
            this.outputFormat = outputFormat;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfigurationS3LogDestination#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#prefix PipesPipe#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeLogConfigurationS3LogDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeLogConfigurationS3LogDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeLogConfigurationS3LogDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeLogConfigurationS3LogDestination {
        private final java.lang.String bucketName;
        private final java.lang.String bucketOwner;
        private final java.lang.String outputFormat;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketOwner = software.amazon.jsii.Kernel.get(this, "bucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputFormat = software.amazon.jsii.Kernel.get(this, "outputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.bucketOwner = java.util.Objects.requireNonNull(builder.bucketOwner, "bucketOwner is required");
            this.outputFormat = builder.outputFormat;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getBucketOwner() {
            return this.bucketOwner;
        }

        @Override
        public final java.lang.String getOutputFormat() {
            return this.outputFormat;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("bucketOwner", om.valueToTree(this.getBucketOwner()));
            if (this.getOutputFormat() != null) {
                data.set("outputFormat", om.valueToTree(this.getOutputFormat()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeLogConfigurationS3LogDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeLogConfigurationS3LogDestination.Jsii$Proxy that = (PipesPipeLogConfigurationS3LogDestination.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!bucketOwner.equals(that.bucketOwner)) return false;
            if (this.outputFormat != null ? !this.outputFormat.equals(that.outputFormat) : that.outputFormat != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.bucketOwner.hashCode());
            result = 31 * result + (this.outputFormat != null ? this.outputFormat.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
