package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#parameter_name ImagebuilderDistributionConfiguration#parameter_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParameterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#ami_account_id ImagebuilderDistributionConfiguration#ami_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmiAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#data_type ImagebuilderDistributionConfiguration#data_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration> {
        java.lang.String parameterName;
        java.lang.String amiAccountId;
        java.lang.String dataType;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration#getParameterName}
         * @param parameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#parameter_name ImagebuilderDistributionConfiguration#parameter_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder parameterName(java.lang.String parameterName) {
            this.parameterName = parameterName;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration#getAmiAccountId}
         * @param amiAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#ami_account_id ImagebuilderDistributionConfiguration#ami_account_id}.
         * @return {@code this}
         */
        public Builder amiAccountId(java.lang.String amiAccountId) {
            this.amiAccountId = amiAccountId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration#getDataType}
         * @param dataType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#data_type ImagebuilderDistributionConfiguration#data_type}.
         * @return {@code this}
         */
        public Builder dataType(java.lang.String dataType) {
            this.dataType = dataType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration {
        private final java.lang.String parameterName;
        private final java.lang.String amiAccountId;
        private final java.lang.String dataType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.parameterName = software.amazon.jsii.Kernel.get(this, "parameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.amiAccountId = software.amazon.jsii.Kernel.get(this, "amiAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataType = software.amazon.jsii.Kernel.get(this, "dataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.parameterName = java.util.Objects.requireNonNull(builder.parameterName, "parameterName is required");
            this.amiAccountId = builder.amiAccountId;
            this.dataType = builder.dataType;
        }

        @Override
        public final java.lang.String getParameterName() {
            return this.parameterName;
        }

        @Override
        public final java.lang.String getAmiAccountId() {
            return this.amiAccountId;
        }

        @Override
        public final java.lang.String getDataType() {
            return this.dataType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("parameterName", om.valueToTree(this.getParameterName()));
            if (this.getAmiAccountId() != null) {
                data.set("amiAccountId", om.valueToTree(this.getAmiAccountId()));
            }
            if (this.getDataType() != null) {
                data.set("dataType", om.valueToTree(this.getDataType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration.Jsii$Proxy) o;

            if (!parameterName.equals(that.parameterName)) return false;
            if (this.amiAccountId != null ? !this.amiAccountId.equals(that.amiAccountId) : that.amiAccountId != null) return false;
            return this.dataType != null ? this.dataType.equals(that.dataType) : that.dataType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.parameterName.hashCode();
            result = 31 * result + (this.amiAccountId != null ? this.amiAccountId.hashCode() : 0);
            result = 31 * result + (this.dataType != null ? this.dataType.hashCode() : 0);
            return result;
        }
    }
}
