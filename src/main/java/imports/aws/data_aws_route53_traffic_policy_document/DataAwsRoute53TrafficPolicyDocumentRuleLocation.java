package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.840Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleLocation")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53TrafficPolicyDocumentRuleLocation.Jsii$Proxy.class)
public interface DataAwsRoute53TrafficPolicyDocumentRuleLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#continent DataAwsRoute53TrafficPolicyDocument#continent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContinent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#country DataAwsRoute53TrafficPolicyDocument#country}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountry() {
        return null;
    }

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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#is_default DataAwsRoute53TrafficPolicyDocument#is_default}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsDefault() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleReference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#subdivision DataAwsRoute53TrafficPolicyDocument#subdivision}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdivision() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53TrafficPolicyDocumentRuleLocation> {
        java.lang.String continent;
        java.lang.String country;
        java.lang.String endpointReference;
        java.lang.Object evaluateTargetHealth;
        java.lang.String healthCheck;
        java.lang.Object isDefault;
        java.lang.String ruleReference;
        java.lang.String subdivision;

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getContinent}
         * @param continent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#continent DataAwsRoute53TrafficPolicyDocument#continent}.
         * @return {@code this}
         */
        public Builder continent(java.lang.String continent) {
            this.continent = continent;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getCountry}
         * @param country Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#country DataAwsRoute53TrafficPolicyDocument#country}.
         * @return {@code this}
         */
        public Builder country(java.lang.String country) {
            this.country = country;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getEndpointReference}
         * @param endpointReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint_reference DataAwsRoute53TrafficPolicyDocument#endpoint_reference}.
         * @return {@code this}
         */
        public Builder endpointReference(java.lang.String endpointReference) {
            this.endpointReference = endpointReference;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(java.lang.Boolean evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(com.hashicorp.cdktf.IResolvable evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getHealthCheck}
         * @param healthCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#health_check DataAwsRoute53TrafficPolicyDocument#health_check}.
         * @return {@code this}
         */
        public Builder healthCheck(java.lang.String healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getIsDefault}
         * @param isDefault Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#is_default DataAwsRoute53TrafficPolicyDocument#is_default}.
         * @return {@code this}
         */
        public Builder isDefault(java.lang.Boolean isDefault) {
            this.isDefault = isDefault;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getIsDefault}
         * @param isDefault Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#is_default DataAwsRoute53TrafficPolicyDocument#is_default}.
         * @return {@code this}
         */
        public Builder isDefault(com.hashicorp.cdktf.IResolvable isDefault) {
            this.isDefault = isDefault;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getRuleReference}
         * @param ruleReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
         * @return {@code this}
         */
        public Builder ruleReference(java.lang.String ruleReference) {
            this.ruleReference = ruleReference;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation#getSubdivision}
         * @param subdivision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#subdivision DataAwsRoute53TrafficPolicyDocument#subdivision}.
         * @return {@code this}
         */
        public Builder subdivision(java.lang.String subdivision) {
            this.subdivision = subdivision;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53TrafficPolicyDocumentRuleLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53TrafficPolicyDocumentRuleLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53TrafficPolicyDocumentRuleLocation {
        private final java.lang.String continent;
        private final java.lang.String country;
        private final java.lang.String endpointReference;
        private final java.lang.Object evaluateTargetHealth;
        private final java.lang.String healthCheck;
        private final java.lang.Object isDefault;
        private final java.lang.String ruleReference;
        private final java.lang.String subdivision;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.continent = software.amazon.jsii.Kernel.get(this, "continent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.country = software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointReference = software.amazon.jsii.Kernel.get(this, "endpointReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.evaluateTargetHealth = software.amazon.jsii.Kernel.get(this, "evaluateTargetHealth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.isDefault = software.amazon.jsii.Kernel.get(this, "isDefault", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ruleReference = software.amazon.jsii.Kernel.get(this, "ruleReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subdivision = software.amazon.jsii.Kernel.get(this, "subdivision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.continent = builder.continent;
            this.country = builder.country;
            this.endpointReference = builder.endpointReference;
            this.evaluateTargetHealth = builder.evaluateTargetHealth;
            this.healthCheck = builder.healthCheck;
            this.isDefault = builder.isDefault;
            this.ruleReference = builder.ruleReference;
            this.subdivision = builder.subdivision;
        }

        @Override
        public final java.lang.String getContinent() {
            return this.continent;
        }

        @Override
        public final java.lang.String getCountry() {
            return this.country;
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
        public final java.lang.Object getIsDefault() {
            return this.isDefault;
        }

        @Override
        public final java.lang.String getRuleReference() {
            return this.ruleReference;
        }

        @Override
        public final java.lang.String getSubdivision() {
            return this.subdivision;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContinent() != null) {
                data.set("continent", om.valueToTree(this.getContinent()));
            }
            if (this.getCountry() != null) {
                data.set("country", om.valueToTree(this.getCountry()));
            }
            if (this.getEndpointReference() != null) {
                data.set("endpointReference", om.valueToTree(this.getEndpointReference()));
            }
            if (this.getEvaluateTargetHealth() != null) {
                data.set("evaluateTargetHealth", om.valueToTree(this.getEvaluateTargetHealth()));
            }
            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getIsDefault() != null) {
                data.set("isDefault", om.valueToTree(this.getIsDefault()));
            }
            if (this.getRuleReference() != null) {
                data.set("ruleReference", om.valueToTree(this.getRuleReference()));
            }
            if (this.getSubdivision() != null) {
                data.set("subdivision", om.valueToTree(this.getSubdivision()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53TrafficPolicyDocumentRuleLocation.Jsii$Proxy that = (DataAwsRoute53TrafficPolicyDocumentRuleLocation.Jsii$Proxy) o;

            if (this.continent != null ? !this.continent.equals(that.continent) : that.continent != null) return false;
            if (this.country != null ? !this.country.equals(that.country) : that.country != null) return false;
            if (this.endpointReference != null ? !this.endpointReference.equals(that.endpointReference) : that.endpointReference != null) return false;
            if (this.evaluateTargetHealth != null ? !this.evaluateTargetHealth.equals(that.evaluateTargetHealth) : that.evaluateTargetHealth != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.isDefault != null ? !this.isDefault.equals(that.isDefault) : that.isDefault != null) return false;
            if (this.ruleReference != null ? !this.ruleReference.equals(that.ruleReference) : that.ruleReference != null) return false;
            return this.subdivision != null ? this.subdivision.equals(that.subdivision) : that.subdivision == null;
        }

        @Override
        public final int hashCode() {
            int result = this.continent != null ? this.continent.hashCode() : 0;
            result = 31 * result + (this.country != null ? this.country.hashCode() : 0);
            result = 31 * result + (this.endpointReference != null ? this.endpointReference.hashCode() : 0);
            result = 31 * result + (this.evaluateTargetHealth != null ? this.evaluateTargetHealth.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.isDefault != null ? this.isDefault.hashCode() : 0);
            result = 31 * result + (this.ruleReference != null ? this.ruleReference.hashCode() : 0);
            result = 31 * result + (this.subdivision != null ? this.subdivision.hashCode() : 0);
            return result;
        }
    }
}
