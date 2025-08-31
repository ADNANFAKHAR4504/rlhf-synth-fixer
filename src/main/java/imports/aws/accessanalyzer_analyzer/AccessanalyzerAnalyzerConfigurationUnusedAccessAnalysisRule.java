package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule")
@software.amazon.jsii.Jsii.Proxy(AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.Jsii$Proxy.class)
public interface AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * exclusion block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#exclusion AccessanalyzerAnalyzer#exclusion}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExclusion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule> {
        java.lang.Object exclusion;

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule#getExclusion}
         * @param exclusion exclusion block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#exclusion AccessanalyzerAnalyzer#exclusion}
         * @return {@code this}
         */
        public Builder exclusion(com.hashicorp.cdktf.IResolvable exclusion) {
            this.exclusion = exclusion;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule#getExclusion}
         * @param exclusion exclusion block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#exclusion AccessanalyzerAnalyzer#exclusion}
         * @return {@code this}
         */
        public Builder exclusion(java.util.List<? extends imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion> exclusion) {
            this.exclusion = exclusion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule {
        private final java.lang.Object exclusion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exclusion = software.amazon.jsii.Kernel.get(this, "exclusion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exclusion = builder.exclusion;
        }

        @Override
        public final java.lang.Object getExclusion() {
            return this.exclusion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExclusion() != null) {
                data.set("exclusion", om.valueToTree(this.getExclusion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.Jsii$Proxy that = (AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.Jsii$Proxy) o;

            return this.exclusion != null ? this.exclusion.equals(that.exclusion) : that.exclusion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exclusion != null ? this.exclusion.hashCode() : 0;
            return result;
        }
    }
}
