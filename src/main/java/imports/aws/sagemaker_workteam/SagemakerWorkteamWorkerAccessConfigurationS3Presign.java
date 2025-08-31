package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkteamWorkerAccessConfigurationS3Presign.Jsii$Proxy.class)
public interface SagemakerWorkteamWorkerAccessConfigurationS3Presign extends software.amazon.jsii.JsiiSerializable {

    /**
     * iam_policy_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#iam_policy_constraints SagemakerWorkteam#iam_policy_constraints}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints getIamPolicyConstraints() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerWorkteamWorkerAccessConfigurationS3Presign}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkteamWorkerAccessConfigurationS3Presign}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkteamWorkerAccessConfigurationS3Presign> {
        imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints iamPolicyConstraints;

        /**
         * Sets the value of {@link SagemakerWorkteamWorkerAccessConfigurationS3Presign#getIamPolicyConstraints}
         * @param iamPolicyConstraints iam_policy_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#iam_policy_constraints SagemakerWorkteam#iam_policy_constraints}
         * @return {@code this}
         */
        public Builder iamPolicyConstraints(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints iamPolicyConstraints) {
            this.iamPolicyConstraints = iamPolicyConstraints;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkteamWorkerAccessConfigurationS3Presign}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkteamWorkerAccessConfigurationS3Presign build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkteamWorkerAccessConfigurationS3Presign}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkteamWorkerAccessConfigurationS3Presign {
        private final imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints iamPolicyConstraints;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.iamPolicyConstraints = software.amazon.jsii.Kernel.get(this, "iamPolicyConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.iamPolicyConstraints = builder.iamPolicyConstraints;
        }

        @Override
        public final imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints getIamPolicyConstraints() {
            return this.iamPolicyConstraints;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIamPolicyConstraints() != null) {
                data.set("iamPolicyConstraints", om.valueToTree(this.getIamPolicyConstraints()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkteamWorkerAccessConfigurationS3Presign.Jsii$Proxy that = (SagemakerWorkteamWorkerAccessConfigurationS3Presign.Jsii$Proxy) o;

            return this.iamPolicyConstraints != null ? this.iamPolicyConstraints.equals(that.iamPolicyConstraints) : that.iamPolicyConstraints == null;
        }

        @Override
        public final int hashCode() {
            int result = this.iamPolicyConstraints != null ? this.iamPolicyConstraints.hashCode() : 0;
            return result;
        }
    }
}
