package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationPagerduty")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanIntegrationPagerduty.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanIntegrationPagerduty extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#secret_id SsmincidentsResponsePlan#secret_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecretId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#service_id SsmincidentsResponsePlan#service_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceId();

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanIntegrationPagerduty}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanIntegrationPagerduty}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanIntegrationPagerduty> {
        java.lang.String name;
        java.lang.String secretId;
        java.lang.String serviceId;

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIntegrationPagerduty#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIntegrationPagerduty#getSecretId}
         * @param secretId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#secret_id SsmincidentsResponsePlan#secret_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder secretId(java.lang.String secretId) {
            this.secretId = secretId;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIntegrationPagerduty#getServiceId}
         * @param serviceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#service_id SsmincidentsResponsePlan#service_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceId(java.lang.String serviceId) {
            this.serviceId = serviceId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmincidentsResponsePlanIntegrationPagerduty}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanIntegrationPagerduty build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanIntegrationPagerduty}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanIntegrationPagerduty {
        private final java.lang.String name;
        private final java.lang.String secretId;
        private final java.lang.String serviceId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretId = software.amazon.jsii.Kernel.get(this, "secretId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceId = software.amazon.jsii.Kernel.get(this, "serviceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.secretId = java.util.Objects.requireNonNull(builder.secretId, "secretId is required");
            this.serviceId = java.util.Objects.requireNonNull(builder.serviceId, "serviceId is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSecretId() {
            return this.secretId;
        }

        @Override
        public final java.lang.String getServiceId() {
            return this.serviceId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("secretId", om.valueToTree(this.getSecretId()));
            data.set("serviceId", om.valueToTree(this.getServiceId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationPagerduty"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanIntegrationPagerduty.Jsii$Proxy that = (SsmincidentsResponsePlanIntegrationPagerduty.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!secretId.equals(that.secretId)) return false;
            return this.serviceId.equals(that.serviceId);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.secretId.hashCode());
            result = 31 * result + (this.serviceId.hashCode());
            return result;
        }
    }
}
