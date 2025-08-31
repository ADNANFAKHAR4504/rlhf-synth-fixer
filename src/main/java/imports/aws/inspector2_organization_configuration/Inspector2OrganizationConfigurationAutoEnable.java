package imports.aws.inspector2_organization_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2OrganizationConfiguration.Inspector2OrganizationConfigurationAutoEnable")
@software.amazon.jsii.Jsii.Proxy(Inspector2OrganizationConfigurationAutoEnable.Jsii$Proxy.class)
public interface Inspector2OrganizationConfigurationAutoEnable extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ec2 Inspector2OrganizationConfiguration#ec2}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEc2();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ecr Inspector2OrganizationConfiguration#ecr}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEcr();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda Inspector2OrganizationConfiguration#lambda}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambda() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda_code Inspector2OrganizationConfiguration#lambda_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambdaCode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Inspector2OrganizationConfigurationAutoEnable}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Inspector2OrganizationConfigurationAutoEnable}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Inspector2OrganizationConfigurationAutoEnable> {
        java.lang.Object ec2;
        java.lang.Object ecr;
        java.lang.Object lambda;
        java.lang.Object lambdaCode;

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getEc2}
         * @param ec2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ec2 Inspector2OrganizationConfiguration#ec2}. This parameter is required.
         * @return {@code this}
         */
        public Builder ec2(java.lang.Boolean ec2) {
            this.ec2 = ec2;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getEc2}
         * @param ec2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ec2 Inspector2OrganizationConfiguration#ec2}. This parameter is required.
         * @return {@code this}
         */
        public Builder ec2(com.hashicorp.cdktf.IResolvable ec2) {
            this.ec2 = ec2;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getEcr}
         * @param ecr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ecr Inspector2OrganizationConfiguration#ecr}. This parameter is required.
         * @return {@code this}
         */
        public Builder ecr(java.lang.Boolean ecr) {
            this.ecr = ecr;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getEcr}
         * @param ecr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#ecr Inspector2OrganizationConfiguration#ecr}. This parameter is required.
         * @return {@code this}
         */
        public Builder ecr(com.hashicorp.cdktf.IResolvable ecr) {
            this.ecr = ecr;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getLambda}
         * @param lambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda Inspector2OrganizationConfiguration#lambda}.
         * @return {@code this}
         */
        public Builder lambda(java.lang.Boolean lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getLambda}
         * @param lambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda Inspector2OrganizationConfiguration#lambda}.
         * @return {@code this}
         */
        public Builder lambda(com.hashicorp.cdktf.IResolvable lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getLambdaCode}
         * @param lambdaCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda_code Inspector2OrganizationConfiguration#lambda_code}.
         * @return {@code this}
         */
        public Builder lambdaCode(java.lang.Boolean lambdaCode) {
            this.lambdaCode = lambdaCode;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2OrganizationConfigurationAutoEnable#getLambdaCode}
         * @param lambdaCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_organization_configuration#lambda_code Inspector2OrganizationConfiguration#lambda_code}.
         * @return {@code this}
         */
        public Builder lambdaCode(com.hashicorp.cdktf.IResolvable lambdaCode) {
            this.lambdaCode = lambdaCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Inspector2OrganizationConfigurationAutoEnable}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Inspector2OrganizationConfigurationAutoEnable build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Inspector2OrganizationConfigurationAutoEnable}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Inspector2OrganizationConfigurationAutoEnable {
        private final java.lang.Object ec2;
        private final java.lang.Object ecr;
        private final java.lang.Object lambda;
        private final java.lang.Object lambdaCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ec2 = software.amazon.jsii.Kernel.get(this, "ec2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ecr = software.amazon.jsii.Kernel.get(this, "ecr", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lambda = software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lambdaCode = software.amazon.jsii.Kernel.get(this, "lambdaCode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ec2 = java.util.Objects.requireNonNull(builder.ec2, "ec2 is required");
            this.ecr = java.util.Objects.requireNonNull(builder.ecr, "ecr is required");
            this.lambda = builder.lambda;
            this.lambdaCode = builder.lambdaCode;
        }

        @Override
        public final java.lang.Object getEc2() {
            return this.ec2;
        }

        @Override
        public final java.lang.Object getEcr() {
            return this.ecr;
        }

        @Override
        public final java.lang.Object getLambda() {
            return this.lambda;
        }

        @Override
        public final java.lang.Object getLambdaCode() {
            return this.lambdaCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ec2", om.valueToTree(this.getEc2()));
            data.set("ecr", om.valueToTree(this.getEcr()));
            if (this.getLambda() != null) {
                data.set("lambda", om.valueToTree(this.getLambda()));
            }
            if (this.getLambdaCode() != null) {
                data.set("lambdaCode", om.valueToTree(this.getLambdaCode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspector2OrganizationConfiguration.Inspector2OrganizationConfigurationAutoEnable"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Inspector2OrganizationConfigurationAutoEnable.Jsii$Proxy that = (Inspector2OrganizationConfigurationAutoEnable.Jsii$Proxy) o;

            if (!ec2.equals(that.ec2)) return false;
            if (!ecr.equals(that.ecr)) return false;
            if (this.lambda != null ? !this.lambda.equals(that.lambda) : that.lambda != null) return false;
            return this.lambdaCode != null ? this.lambdaCode.equals(that.lambdaCode) : that.lambdaCode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ec2.hashCode();
            result = 31 * result + (this.ecr.hashCode());
            result = 31 * result + (this.lambda != null ? this.lambda.hashCode() : 0);
            result = 31 * result + (this.lambdaCode != null ? this.lambdaCode.hashCode() : 0);
            return result;
        }
    }
}
