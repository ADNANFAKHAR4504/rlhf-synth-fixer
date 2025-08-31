package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess")
@software.amazon.jsii.Jsii.Proxy(AccessanalyzerAnalyzerConfigurationUnusedAccess.Jsii$Proxy.class)
public interface AccessanalyzerAnalyzerConfigurationUnusedAccess extends software.amazon.jsii.JsiiSerializable {

    /**
     * analysis_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#analysis_rule AccessanalyzerAnalyzer#analysis_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule getAnalysisRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#unused_access_age AccessanalyzerAnalyzer#unused_access_age}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnusedAccessAge() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccessanalyzerAnalyzerConfigurationUnusedAccess}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccessanalyzerAnalyzerConfigurationUnusedAccess}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccessanalyzerAnalyzerConfigurationUnusedAccess> {
        imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule analysisRule;
        java.lang.Number unusedAccessAge;

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccess#getAnalysisRule}
         * @param analysisRule analysis_rule block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#analysis_rule AccessanalyzerAnalyzer#analysis_rule}
         * @return {@code this}
         */
        public Builder analysisRule(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule analysisRule) {
            this.analysisRule = analysisRule;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccess#getUnusedAccessAge}
         * @param unusedAccessAge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#unused_access_age AccessanalyzerAnalyzer#unused_access_age}.
         * @return {@code this}
         */
        public Builder unusedAccessAge(java.lang.Number unusedAccessAge) {
            this.unusedAccessAge = unusedAccessAge;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccessanalyzerAnalyzerConfigurationUnusedAccess}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccessanalyzerAnalyzerConfigurationUnusedAccess build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccessanalyzerAnalyzerConfigurationUnusedAccess}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccessanalyzerAnalyzerConfigurationUnusedAccess {
        private final imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule analysisRule;
        private final java.lang.Number unusedAccessAge;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.analysisRule = software.amazon.jsii.Kernel.get(this, "analysisRule", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.class));
            this.unusedAccessAge = software.amazon.jsii.Kernel.get(this, "unusedAccessAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.analysisRule = builder.analysisRule;
            this.unusedAccessAge = builder.unusedAccessAge;
        }

        @Override
        public final imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule getAnalysisRule() {
            return this.analysisRule;
        }

        @Override
        public final java.lang.Number getUnusedAccessAge() {
            return this.unusedAccessAge;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAnalysisRule() != null) {
                data.set("analysisRule", om.valueToTree(this.getAnalysisRule()));
            }
            if (this.getUnusedAccessAge() != null) {
                data.set("unusedAccessAge", om.valueToTree(this.getUnusedAccessAge()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccessanalyzerAnalyzerConfigurationUnusedAccess.Jsii$Proxy that = (AccessanalyzerAnalyzerConfigurationUnusedAccess.Jsii$Proxy) o;

            if (this.analysisRule != null ? !this.analysisRule.equals(that.analysisRule) : that.analysisRule != null) return false;
            return this.unusedAccessAge != null ? this.unusedAccessAge.equals(that.unusedAccessAge) : that.unusedAccessAge == null;
        }

        @Override
        public final int hashCode() {
            int result = this.analysisRule != null ? this.analysisRule.hashCode() : 0;
            result = 31 * result + (this.unusedAccessAge != null ? this.unusedAccessAge.hashCode() : 0);
            return result;
        }
    }
}
