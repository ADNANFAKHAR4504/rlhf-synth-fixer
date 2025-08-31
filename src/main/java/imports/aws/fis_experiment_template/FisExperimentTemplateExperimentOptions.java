package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentOptions")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateExperimentOptions.Jsii$Proxy.class)
public interface FisExperimentTemplateExperimentOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#account_targeting FisExperimentTemplate#account_targeting}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountTargeting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#empty_target_resolution_mode FisExperimentTemplate#empty_target_resolution_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmptyTargetResolutionMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateExperimentOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateExperimentOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateExperimentOptions> {
        java.lang.String accountTargeting;
        java.lang.String emptyTargetResolutionMode;

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentOptions#getAccountTargeting}
         * @param accountTargeting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#account_targeting FisExperimentTemplate#account_targeting}.
         * @return {@code this}
         */
        public Builder accountTargeting(java.lang.String accountTargeting) {
            this.accountTargeting = accountTargeting;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentOptions#getEmptyTargetResolutionMode}
         * @param emptyTargetResolutionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#empty_target_resolution_mode FisExperimentTemplate#empty_target_resolution_mode}.
         * @return {@code this}
         */
        public Builder emptyTargetResolutionMode(java.lang.String emptyTargetResolutionMode) {
            this.emptyTargetResolutionMode = emptyTargetResolutionMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateExperimentOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateExperimentOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateExperimentOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateExperimentOptions {
        private final java.lang.String accountTargeting;
        private final java.lang.String emptyTargetResolutionMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountTargeting = software.amazon.jsii.Kernel.get(this, "accountTargeting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emptyTargetResolutionMode = software.amazon.jsii.Kernel.get(this, "emptyTargetResolutionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountTargeting = builder.accountTargeting;
            this.emptyTargetResolutionMode = builder.emptyTargetResolutionMode;
        }

        @Override
        public final java.lang.String getAccountTargeting() {
            return this.accountTargeting;
        }

        @Override
        public final java.lang.String getEmptyTargetResolutionMode() {
            return this.emptyTargetResolutionMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccountTargeting() != null) {
                data.set("accountTargeting", om.valueToTree(this.getAccountTargeting()));
            }
            if (this.getEmptyTargetResolutionMode() != null) {
                data.set("emptyTargetResolutionMode", om.valueToTree(this.getEmptyTargetResolutionMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateExperimentOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateExperimentOptions.Jsii$Proxy that = (FisExperimentTemplateExperimentOptions.Jsii$Proxy) o;

            if (this.accountTargeting != null ? !this.accountTargeting.equals(that.accountTargeting) : that.accountTargeting != null) return false;
            return this.emptyTargetResolutionMode != null ? this.emptyTargetResolutionMode.equals(that.emptyTargetResolutionMode) : that.emptyTargetResolutionMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountTargeting != null ? this.accountTargeting.hashCode() : 0;
            result = 31 * result + (this.emptyTargetResolutionMode != null ? this.emptyTargetResolutionMode.hashCode() : 0);
            return result;
        }
    }
}
