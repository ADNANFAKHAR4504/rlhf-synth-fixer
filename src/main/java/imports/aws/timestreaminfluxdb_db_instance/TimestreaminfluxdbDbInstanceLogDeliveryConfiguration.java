package imports.aws.timestreaminfluxdb_db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.545Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration")
@software.amazon.jsii.Jsii.Proxy(TimestreaminfluxdbDbInstanceLogDeliveryConfiguration.Jsii$Proxy.class)
public interface TimestreaminfluxdbDbInstanceLogDeliveryConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#s3_configuration TimestreaminfluxdbDbInstance#s3_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Configuration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreaminfluxdbDbInstanceLogDeliveryConfiguration> {
        java.lang.Object s3Configuration;

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#s3_configuration TimestreaminfluxdbDbInstance#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(com.hashicorp.cdktf.IResolvable s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#s3_configuration TimestreaminfluxdbDbInstance#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(java.util.List<? extends imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration> s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreaminfluxdbDbInstanceLogDeliveryConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreaminfluxdbDbInstanceLogDeliveryConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreaminfluxdbDbInstanceLogDeliveryConfiguration {
        private final java.lang.Object s3Configuration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Configuration = builder.s3Configuration;
        }

        @Override
        public final java.lang.Object getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Configuration() != null) {
                data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreaminfluxdbDbInstanceLogDeliveryConfiguration.Jsii$Proxy that = (TimestreaminfluxdbDbInstanceLogDeliveryConfiguration.Jsii$Proxy) o;

            return this.s3Configuration != null ? this.s3Configuration.equals(that.s3Configuration) : that.s3Configuration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Configuration != null ? this.s3Configuration.hashCode() : 0;
            return result;
        }
    }
}
