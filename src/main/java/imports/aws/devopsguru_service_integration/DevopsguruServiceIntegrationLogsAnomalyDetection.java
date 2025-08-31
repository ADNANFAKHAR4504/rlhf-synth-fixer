package imports.aws.devopsguru_service_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.996Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationLogsAnomalyDetection")
@software.amazon.jsii.Jsii.Proxy(DevopsguruServiceIntegrationLogsAnomalyDetection.Jsii$Proxy.class)
public interface DevopsguruServiceIntegrationLogsAnomalyDetection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOptInStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevopsguruServiceIntegrationLogsAnomalyDetection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruServiceIntegrationLogsAnomalyDetection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruServiceIntegrationLogsAnomalyDetection> {
        java.lang.String optInStatus;

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationLogsAnomalyDetection#getOptInStatus}
         * @param optInStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
         * @return {@code this}
         */
        public Builder optInStatus(java.lang.String optInStatus) {
            this.optInStatus = optInStatus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruServiceIntegrationLogsAnomalyDetection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruServiceIntegrationLogsAnomalyDetection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruServiceIntegrationLogsAnomalyDetection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruServiceIntegrationLogsAnomalyDetection {
        private final java.lang.String optInStatus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.optInStatus = software.amazon.jsii.Kernel.get(this, "optInStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.optInStatus = builder.optInStatus;
        }

        @Override
        public final java.lang.String getOptInStatus() {
            return this.optInStatus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOptInStatus() != null) {
                data.set("optInStatus", om.valueToTree(this.getOptInStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationLogsAnomalyDetection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruServiceIntegrationLogsAnomalyDetection.Jsii$Proxy that = (DevopsguruServiceIntegrationLogsAnomalyDetection.Jsii$Proxy) o;

            return this.optInStatus != null ? this.optInStatus.equals(that.optInStatus) : that.optInStatus == null;
        }

        @Override
        public final int hashCode() {
            int result = this.optInStatus != null ? this.optInStatus.hashCode() : 0;
            return result;
        }
    }
}
