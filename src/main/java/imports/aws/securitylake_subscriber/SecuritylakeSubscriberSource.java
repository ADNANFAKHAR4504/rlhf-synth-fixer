package imports.aws.securitylake_subscriber;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.421Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriber.SecuritylakeSubscriberSource")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberSource.Jsii$Proxy.class)
public interface SecuritylakeSubscriberSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * aws_log_source_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#aws_log_source_resource SecuritylakeSubscriber#aws_log_source_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAwsLogSourceResource() {
        return null;
    }

    /**
     * custom_log_source_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#custom_log_source_resource SecuritylakeSubscriber#custom_log_source_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomLogSourceResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberSource> {
        java.lang.Object awsLogSourceResource;
        java.lang.Object customLogSourceResource;

        /**
         * Sets the value of {@link SecuritylakeSubscriberSource#getAwsLogSourceResource}
         * @param awsLogSourceResource aws_log_source_resource block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#aws_log_source_resource SecuritylakeSubscriber#aws_log_source_resource}
         * @return {@code this}
         */
        public Builder awsLogSourceResource(com.hashicorp.cdktf.IResolvable awsLogSourceResource) {
            this.awsLogSourceResource = awsLogSourceResource;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberSource#getAwsLogSourceResource}
         * @param awsLogSourceResource aws_log_source_resource block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#aws_log_source_resource SecuritylakeSubscriber#aws_log_source_resource}
         * @return {@code this}
         */
        public Builder awsLogSourceResource(java.util.List<? extends imports.aws.securitylake_subscriber.SecuritylakeSubscriberSourceAwsLogSourceResource> awsLogSourceResource) {
            this.awsLogSourceResource = awsLogSourceResource;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberSource#getCustomLogSourceResource}
         * @param customLogSourceResource custom_log_source_resource block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#custom_log_source_resource SecuritylakeSubscriber#custom_log_source_resource}
         * @return {@code this}
         */
        public Builder customLogSourceResource(com.hashicorp.cdktf.IResolvable customLogSourceResource) {
            this.customLogSourceResource = customLogSourceResource;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberSource#getCustomLogSourceResource}
         * @param customLogSourceResource custom_log_source_resource block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#custom_log_source_resource SecuritylakeSubscriber#custom_log_source_resource}
         * @return {@code this}
         */
        public Builder customLogSourceResource(java.util.List<? extends imports.aws.securitylake_subscriber.SecuritylakeSubscriberSourceCustomLogSourceResource> customLogSourceResource) {
            this.customLogSourceResource = customLogSourceResource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeSubscriberSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberSource {
        private final java.lang.Object awsLogSourceResource;
        private final java.lang.Object customLogSourceResource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsLogSourceResource = software.amazon.jsii.Kernel.get(this, "awsLogSourceResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customLogSourceResource = software.amazon.jsii.Kernel.get(this, "customLogSourceResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsLogSourceResource = builder.awsLogSourceResource;
            this.customLogSourceResource = builder.customLogSourceResource;
        }

        @Override
        public final java.lang.Object getAwsLogSourceResource() {
            return this.awsLogSourceResource;
        }

        @Override
        public final java.lang.Object getCustomLogSourceResource() {
            return this.customLogSourceResource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAwsLogSourceResource() != null) {
                data.set("awsLogSourceResource", om.valueToTree(this.getAwsLogSourceResource()));
            }
            if (this.getCustomLogSourceResource() != null) {
                data.set("customLogSourceResource", om.valueToTree(this.getCustomLogSourceResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriber.SecuritylakeSubscriberSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberSource.Jsii$Proxy that = (SecuritylakeSubscriberSource.Jsii$Proxy) o;

            if (this.awsLogSourceResource != null ? !this.awsLogSourceResource.equals(that.awsLogSourceResource) : that.awsLogSourceResource != null) return false;
            return this.customLogSourceResource != null ? this.customLogSourceResource.equals(that.customLogSourceResource) : that.customLogSourceResource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.awsLogSourceResource != null ? this.awsLogSourceResource.hashCode() : 0;
            result = 31 * result + (this.customLogSourceResource != null ? this.customLogSourceResource.hashCode() : 0);
            return result;
        }
    }
}
