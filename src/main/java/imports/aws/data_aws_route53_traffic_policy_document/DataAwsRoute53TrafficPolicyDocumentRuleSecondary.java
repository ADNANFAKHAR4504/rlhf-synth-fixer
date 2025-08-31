package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.840Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleSecondary")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53TrafficPolicyDocumentRuleSecondary.Jsii$Proxy.class)
public interface DataAwsRoute53TrafficPolicyDocumentRuleSecondary extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint_reference DataAwsRoute53TrafficPolicyDocument#endpoint_reference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointReference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEvaluateTargetHealth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#health_check DataAwsRoute53TrafficPolicyDocument#health_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleReference() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53TrafficPolicyDocumentRuleSecondary> {
        java.lang.String endpointReference;
        java.lang.Object evaluateTargetHealth;
        java.lang.String healthCheck;
        java.lang.String ruleReference;

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary#getEndpointReference}
         * @param endpointReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint_reference DataAwsRoute53TrafficPolicyDocument#endpoint_reference}.
         * @return {@code this}
         */
        public Builder endpointReference(java.lang.String endpointReference) {
            this.endpointReference = endpointReference;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(java.lang.Boolean evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(com.hashicorp.cdktf.IResolvable evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary#getHealthCheck}
         * @param healthCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#health_check DataAwsRoute53TrafficPolicyDocument#health_check}.
         * @return {@code this}
         */
        public Builder healthCheck(java.lang.String healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary#getRuleReference}
         * @param ruleReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
         * @return {@code this}
         */
        public Builder ruleReference(java.lang.String ruleReference) {
            this.ruleReference = ruleReference;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53TrafficPolicyDocumentRuleSecondary build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53TrafficPolicyDocumentRuleSecondary}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53TrafficPolicyDocumentRuleSecondary {
        private final java.lang.String endpointReference;
        private final java.lang.Object evaluateTargetHealth;
        private final java.lang.String healthCheck;
        private final java.lang.String ruleReference;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpointReference = software.amazon.jsii.Kernel.get(this, "endpointReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.evaluateTargetHealth = software.amazon.jsii.Kernel.get(this, "evaluateTargetHealth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleReference = software.amazon.jsii.Kernel.get(this, "ruleReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpointReference = builder.endpointReference;
            this.evaluateTargetHealth = builder.evaluateTargetHealth;
            this.healthCheck = builder.healthCheck;
            this.ruleReference = builder.ruleReference;
        }

        @Override
        public final java.lang.String getEndpointReference() {
            return this.endpointReference;
        }

        @Override
        public final java.lang.Object getEvaluateTargetHealth() {
            return this.evaluateTargetHealth;
        }

        @Override
        public final java.lang.String getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final java.lang.String getRuleReference() {
            return this.ruleReference;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEndpointReference() != null) {
                data.set("endpointReference", om.valueToTree(this.getEndpointReference()));
            }
            if (this.getEvaluateTargetHealth() != null) {
                data.set("evaluateTargetHealth", om.valueToTree(this.getEvaluateTargetHealth()));
            }
            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getRuleReference() != null) {
                data.set("ruleReference", om.valueToTree(this.getRuleReference()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleSecondary"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53TrafficPolicyDocumentRuleSecondary.Jsii$Proxy that = (DataAwsRoute53TrafficPolicyDocumentRuleSecondary.Jsii$Proxy) o;

            if (this.endpointReference != null ? !this.endpointReference.equals(that.endpointReference) : that.endpointReference != null) return false;
            if (this.evaluateTargetHealth != null ? !this.evaluateTargetHealth.equals(that.evaluateTargetHealth) : that.evaluateTargetHealth != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            return this.ruleReference != null ? this.ruleReference.equals(that.ruleReference) : that.ruleReference == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpointReference != null ? this.endpointReference.hashCode() : 0;
            result = 31 * result + (this.evaluateTargetHealth != null ? this.evaluateTargetHealth.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.ruleReference != null ? this.ruleReference.hashCode() : 0);
            return result;
        }
    }
}
