package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.Jsii$Proxy.class)
public interface SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#source_ip SagemakerWorkteam#source_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#vpc_source_ip SagemakerWorkteam#vpc_source_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcSourceIp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints> {
        java.lang.String sourceIp;
        java.lang.String vpcSourceIp;

        /**
         * Sets the value of {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints#getSourceIp}
         * @param sourceIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#source_ip SagemakerWorkteam#source_ip}.
         * @return {@code this}
         */
        public Builder sourceIp(java.lang.String sourceIp) {
            this.sourceIp = sourceIp;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints#getVpcSourceIp}
         * @param vpcSourceIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#vpc_source_ip SagemakerWorkteam#vpc_source_ip}.
         * @return {@code this}
         */
        public Builder vpcSourceIp(java.lang.String vpcSourceIp) {
            this.vpcSourceIp = vpcSourceIp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints {
        private final java.lang.String sourceIp;
        private final java.lang.String vpcSourceIp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceIp = software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcSourceIp = software.amazon.jsii.Kernel.get(this, "vpcSourceIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceIp = builder.sourceIp;
            this.vpcSourceIp = builder.vpcSourceIp;
        }

        @Override
        public final java.lang.String getSourceIp() {
            return this.sourceIp;
        }

        @Override
        public final java.lang.String getVpcSourceIp() {
            return this.vpcSourceIp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceIp() != null) {
                data.set("sourceIp", om.valueToTree(this.getSourceIp()));
            }
            if (this.getVpcSourceIp() != null) {
                data.set("vpcSourceIp", om.valueToTree(this.getVpcSourceIp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.Jsii$Proxy that = (SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.Jsii$Proxy) o;

            if (this.sourceIp != null ? !this.sourceIp.equals(that.sourceIp) : that.sourceIp != null) return false;
            return this.vpcSourceIp != null ? this.vpcSourceIp.equals(that.vpcSourceIp) : that.vpcSourceIp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceIp != null ? this.sourceIp.hashCode() : 0;
            result = 31 * result + (this.vpcSourceIp != null ? this.vpcSourceIp.hashCode() : 0);
            return result;
        }
    }
}
