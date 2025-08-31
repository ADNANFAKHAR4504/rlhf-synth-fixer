package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames")
@software.amazon.jsii.Jsii.Proxy(CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames.Jsii$Proxy.class)
public interface CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#quantity CloudfrontContinuousDeploymentPolicy#quantity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getQuantity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#items CloudfrontContinuousDeploymentPolicy#items}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getItems() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames> {
        java.lang.Number quantity;
        java.util.List<java.lang.String> items;

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames#getQuantity}
         * @param quantity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#quantity CloudfrontContinuousDeploymentPolicy#quantity}. This parameter is required.
         * @return {@code this}
         */
        public Builder quantity(java.lang.Number quantity) {
            this.quantity = quantity;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames#getItems}
         * @param items Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#items CloudfrontContinuousDeploymentPolicy#items}.
         * @return {@code this}
         */
        public Builder items(java.util.List<java.lang.String> items) {
            this.items = items;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames {
        private final java.lang.Number quantity;
        private final java.util.List<java.lang.String> items;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.quantity = software.amazon.jsii.Kernel.get(this, "quantity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.items = software.amazon.jsii.Kernel.get(this, "items", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.quantity = java.util.Objects.requireNonNull(builder.quantity, "quantity is required");
            this.items = builder.items;
        }

        @Override
        public final java.lang.Number getQuantity() {
            return this.quantity;
        }

        @Override
        public final java.util.List<java.lang.String> getItems() {
            return this.items;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("quantity", om.valueToTree(this.getQuantity()));
            if (this.getItems() != null) {
                data.set("items", om.valueToTree(this.getItems()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames.Jsii$Proxy that = (CloudfrontContinuousDeploymentPolicyStagingDistributionDnsNames.Jsii$Proxy) o;

            if (!quantity.equals(that.quantity)) return false;
            return this.items != null ? this.items.equals(that.items) : that.items == null;
        }

        @Override
        public final int hashCode() {
            int result = this.quantity.hashCode();
            result = 31 * result + (this.items != null ? this.items.hashCode() : 0);
            return result;
        }
    }
}
