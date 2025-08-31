package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailureConditionRule")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageOnFailureConditionRule.Jsii$Proxy.class)
public interface CodepipelineStageOnFailureConditionRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * rule_type_id block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId getRuleTypeId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommands() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInputArtifacts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageOnFailureConditionRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageOnFailureConditionRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageOnFailureConditionRule> {
        java.lang.String name;
        imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId ruleTypeId;
        java.util.List<java.lang.String> commands;
        java.util.Map<java.lang.String, java.lang.String> configuration;
        java.util.List<java.lang.String> inputArtifacts;
        java.lang.String region;
        java.lang.String roleArn;
        java.lang.Number timeoutInMinutes;

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getRuleTypeId}
         * @param ruleTypeId rule_type_id block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
         * @return {@code this}
         */
        public Builder ruleTypeId(imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId ruleTypeId) {
            this.ruleTypeId = ruleTypeId;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getCommands}
         * @param commands Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.
         * @return {@code this}
         */
        public Builder commands(java.util.List<java.lang.String> commands) {
            this.commands = commands;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getConfiguration}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
         * @return {@code this}
         */
        public Builder configuration(java.util.Map<java.lang.String, java.lang.String> configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getInputArtifacts}
         * @param inputArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
         * @return {@code this}
         */
        public Builder inputArtifacts(java.util.List<java.lang.String> inputArtifacts) {
            this.inputArtifacts = inputArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRule#getTimeoutInMinutes}
         * @param timeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder timeoutInMinutes(java.lang.Number timeoutInMinutes) {
            this.timeoutInMinutes = timeoutInMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageOnFailureConditionRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageOnFailureConditionRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageOnFailureConditionRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageOnFailureConditionRule {
        private final java.lang.String name;
        private final imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId ruleTypeId;
        private final java.util.List<java.lang.String> commands;
        private final java.util.Map<java.lang.String, java.lang.String> configuration;
        private final java.util.List<java.lang.String> inputArtifacts;
        private final java.lang.String region;
        private final java.lang.String roleArn;
        private final java.lang.Number timeoutInMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleTypeId = software.amazon.jsii.Kernel.get(this, "ruleTypeId", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId.class));
            this.commands = software.amazon.jsii.Kernel.get(this, "commands", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inputArtifacts = software.amazon.jsii.Kernel.get(this, "inputArtifacts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutInMinutes = software.amazon.jsii.Kernel.get(this, "timeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.ruleTypeId = java.util.Objects.requireNonNull(builder.ruleTypeId, "ruleTypeId is required");
            this.commands = builder.commands;
            this.configuration = builder.configuration;
            this.inputArtifacts = builder.inputArtifacts;
            this.region = builder.region;
            this.roleArn = builder.roleArn;
            this.timeoutInMinutes = builder.timeoutInMinutes;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId getRuleTypeId() {
            return this.ruleTypeId;
        }

        @Override
        public final java.util.List<java.lang.String> getCommands() {
            return this.commands;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.util.List<java.lang.String> getInputArtifacts() {
            return this.inputArtifacts;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Number getTimeoutInMinutes() {
            return this.timeoutInMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("ruleTypeId", om.valueToTree(this.getRuleTypeId()));
            if (this.getCommands() != null) {
                data.set("commands", om.valueToTree(this.getCommands()));
            }
            if (this.getConfiguration() != null) {
                data.set("configuration", om.valueToTree(this.getConfiguration()));
            }
            if (this.getInputArtifacts() != null) {
                data.set("inputArtifacts", om.valueToTree(this.getInputArtifacts()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getTimeoutInMinutes() != null) {
                data.set("timeoutInMinutes", om.valueToTree(this.getTimeoutInMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageOnFailureConditionRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageOnFailureConditionRule.Jsii$Proxy that = (CodepipelineStageOnFailureConditionRule.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!ruleTypeId.equals(that.ruleTypeId)) return false;
            if (this.commands != null ? !this.commands.equals(that.commands) : that.commands != null) return false;
            if (this.configuration != null ? !this.configuration.equals(that.configuration) : that.configuration != null) return false;
            if (this.inputArtifacts != null ? !this.inputArtifacts.equals(that.inputArtifacts) : that.inputArtifacts != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            return this.timeoutInMinutes != null ? this.timeoutInMinutes.equals(that.timeoutInMinutes) : that.timeoutInMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.ruleTypeId.hashCode());
            result = 31 * result + (this.commands != null ? this.commands.hashCode() : 0);
            result = 31 * result + (this.configuration != null ? this.configuration.hashCode() : 0);
            result = 31 * result + (this.inputArtifacts != null ? this.inputArtifacts.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.timeoutInMinutes != null ? this.timeoutInMinutes.hashCode() : 0);
            return result;
        }
    }
}
