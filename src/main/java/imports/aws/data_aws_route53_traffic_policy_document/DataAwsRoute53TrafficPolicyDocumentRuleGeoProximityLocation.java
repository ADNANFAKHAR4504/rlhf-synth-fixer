package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.839Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation.Jsii$Proxy.class)
public interface DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#bias DataAwsRoute53TrafficPolicyDocument#bias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBias() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#latitude DataAwsRoute53TrafficPolicyDocument#latitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLatitude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#longitude DataAwsRoute53TrafficPolicyDocument#longitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLongitude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#region DataAwsRoute53TrafficPolicyDocument#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleReference() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation> {
        java.lang.String bias;
        java.lang.String endpointReference;
        java.lang.Object evaluateTargetHealth;
        java.lang.String healthCheck;
        java.lang.String latitude;
        java.lang.String longitude;
        java.lang.String region;
        java.lang.String ruleReference;

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getBias}
         * @param bias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#bias DataAwsRoute53TrafficPolicyDocument#bias}.
         * @return {@code this}
         */
        public Builder bias(java.lang.String bias) {
            this.bias = bias;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getEndpointReference}
         * @param endpointReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint_reference DataAwsRoute53TrafficPolicyDocument#endpoint_reference}.
         * @return {@code this}
         */
        public Builder endpointReference(java.lang.String endpointReference) {
            this.endpointReference = endpointReference;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(java.lang.Boolean evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getEvaluateTargetHealth}
         * @param evaluateTargetHealth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#evaluate_target_health DataAwsRoute53TrafficPolicyDocument#evaluate_target_health}.
         * @return {@code this}
         */
        public Builder evaluateTargetHealth(com.hashicorp.cdktf.IResolvable evaluateTargetHealth) {
            this.evaluateTargetHealth = evaluateTargetHealth;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getHealthCheck}
         * @param healthCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#health_check DataAwsRoute53TrafficPolicyDocument#health_check}.
         * @return {@code this}
         */
        public Builder healthCheck(java.lang.String healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getLatitude}
         * @param latitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#latitude DataAwsRoute53TrafficPolicyDocument#latitude}.
         * @return {@code this}
         */
        public Builder latitude(java.lang.String latitude) {
            this.latitude = latitude;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getLongitude}
         * @param longitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#longitude DataAwsRoute53TrafficPolicyDocument#longitude}.
         * @return {@code this}
         */
        public Builder longitude(java.lang.String longitude) {
            this.longitude = longitude;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#region DataAwsRoute53TrafficPolicyDocument#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation#getRuleReference}
         * @param ruleReference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule_reference DataAwsRoute53TrafficPolicyDocument#rule_reference}.
         * @return {@code this}
         */
        public Builder ruleReference(java.lang.String ruleReference) {
            this.ruleReference = ruleReference;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation {
        private final java.lang.String bias;
        private final java.lang.String endpointReference;
        private final java.lang.Object evaluateTargetHealth;
        private final java.lang.String healthCheck;
        private final java.lang.String latitude;
        private final java.lang.String longitude;
        private final java.lang.String region;
        private final java.lang.String ruleReference;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bias = software.amazon.jsii.Kernel.get(this, "bias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointReference = software.amazon.jsii.Kernel.get(this, "endpointReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.evaluateTargetHealth = software.amazon.jsii.Kernel.get(this, "evaluateTargetHealth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.latitude = software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longitude = software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleReference = software.amazon.jsii.Kernel.get(this, "ruleReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bias = builder.bias;
            this.endpointReference = builder.endpointReference;
            this.evaluateTargetHealth = builder.evaluateTargetHealth;
            this.healthCheck = builder.healthCheck;
            this.latitude = builder.latitude;
            this.longitude = builder.longitude;
            this.region = builder.region;
            this.ruleReference = builder.ruleReference;
        }

        @Override
        public final java.lang.String getBias() {
            return this.bias;
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
        public final java.lang.String getLatitude() {
            return this.latitude;
        }

        @Override
        public final java.lang.String getLongitude() {
            return this.longitude;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
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

            if (this.getBias() != null) {
                data.set("bias", om.valueToTree(this.getBias()));
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
            if (this.getLatitude() != null) {
                data.set("latitude", om.valueToTree(this.getLatitude()));
            }
            if (this.getLongitude() != null) {
                data.set("longitude", om.valueToTree(this.getLongitude()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getRuleReference() != null) {
                data.set("ruleReference", om.valueToTree(this.getRuleReference()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation.Jsii$Proxy that = (DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation.Jsii$Proxy) o;

            if (this.bias != null ? !this.bias.equals(that.bias) : that.bias != null) return false;
            if (this.endpointReference != null ? !this.endpointReference.equals(that.endpointReference) : that.endpointReference != null) return false;
            if (this.evaluateTargetHealth != null ? !this.evaluateTargetHealth.equals(that.evaluateTargetHealth) : that.evaluateTargetHealth != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.latitude != null ? !this.latitude.equals(that.latitude) : that.latitude != null) return false;
            if (this.longitude != null ? !this.longitude.equals(that.longitude) : that.longitude != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            return this.ruleReference != null ? this.ruleReference.equals(that.ruleReference) : that.ruleReference == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bias != null ? this.bias.hashCode() : 0;
            result = 31 * result + (this.endpointReference != null ? this.endpointReference.hashCode() : 0);
            result = 31 * result + (this.evaluateTargetHealth != null ? this.evaluateTargetHealth.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.latitude != null ? this.latitude.hashCode() : 0);
            result = 31 * result + (this.longitude != null ? this.longitude.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.ruleReference != null ? this.ruleReference.hashCode() : 0);
            return result;
        }
    }
}
