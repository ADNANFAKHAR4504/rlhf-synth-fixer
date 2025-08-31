package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.004Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetails")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetails.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#action DlmLifecyclePolicy#action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction getAction() {
        return null;
    }

    /**
     * event_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#event_source DlmLifecyclePolicy#event_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource getEventSource() {
        return null;
    }

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#parameters DlmLifecyclePolicy#parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#policy_type DlmLifecyclePolicy#policy_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicyType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#resource_locations DlmLifecyclePolicy#resource_locations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceLocations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#resource_types DlmLifecyclePolicy#resource_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypes() {
        return null;
    }

    /**
     * schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#schedule DlmLifecyclePolicy#schedule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target_tags DlmLifecyclePolicy#target_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTargetTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetails> {
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction action;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource eventSource;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters parameters;
        java.lang.String policyType;
        java.util.List<java.lang.String> resourceLocations;
        java.util.List<java.lang.String> resourceTypes;
        java.lang.Object schedule;
        java.util.Map<java.lang.String, java.lang.String> targetTags;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#action DlmLifecyclePolicy#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getEventSource}
         * @param eventSource event_source block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#event_source DlmLifecyclePolicy#event_source}
         * @return {@code this}
         */
        public Builder eventSource(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource eventSource) {
            this.eventSource = eventSource;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#parameters DlmLifecyclePolicy#parameters}
         * @return {@code this}
         */
        public Builder parameters(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getPolicyType}
         * @param policyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#policy_type DlmLifecyclePolicy#policy_type}.
         * @return {@code this}
         */
        public Builder policyType(java.lang.String policyType) {
            this.policyType = policyType;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getResourceLocations}
         * @param resourceLocations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#resource_locations DlmLifecyclePolicy#resource_locations}.
         * @return {@code this}
         */
        public Builder resourceLocations(java.util.List<java.lang.String> resourceLocations) {
            this.resourceLocations = resourceLocations;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getResourceTypes}
         * @param resourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#resource_types DlmLifecyclePolicy#resource_types}.
         * @return {@code this}
         */
        public Builder resourceTypes(java.util.List<java.lang.String> resourceTypes) {
            this.resourceTypes = resourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getSchedule}
         * @param schedule schedule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#schedule DlmLifecyclePolicy#schedule}
         * @return {@code this}
         */
        public Builder schedule(com.hashicorp.cdktf.IResolvable schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getSchedule}
         * @param schedule schedule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#schedule DlmLifecyclePolicy#schedule}
         * @return {@code this}
         */
        public Builder schedule(java.util.List<? extends imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsSchedule> schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetails#getTargetTags}
         * @param targetTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target_tags DlmLifecyclePolicy#target_tags}.
         * @return {@code this}
         */
        public Builder targetTags(java.util.Map<java.lang.String, java.lang.String> targetTags) {
            this.targetTags = targetTags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetails {
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction action;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource eventSource;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters parameters;
        private final java.lang.String policyType;
        private final java.util.List<java.lang.String> resourceLocations;
        private final java.util.List<java.lang.String> resourceTypes;
        private final java.lang.Object schedule;
        private final java.util.Map<java.lang.String, java.lang.String> targetTags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction.class));
            this.eventSource = software.amazon.jsii.Kernel.get(this, "eventSource", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters.class));
            this.policyType = software.amazon.jsii.Kernel.get(this, "policyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceLocations = software.amazon.jsii.Kernel.get(this, "resourceLocations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceTypes = software.amazon.jsii.Kernel.get(this, "resourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetTags = software.amazon.jsii.Kernel.get(this, "targetTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = builder.action;
            this.eventSource = builder.eventSource;
            this.parameters = builder.parameters;
            this.policyType = builder.policyType;
            this.resourceLocations = builder.resourceLocations;
            this.resourceTypes = builder.resourceTypes;
            this.schedule = builder.schedule;
            this.targetTags = builder.targetTags;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsAction getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSource getEventSource() {
            return this.eventSource;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getPolicyType() {
            return this.policyType;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceLocations() {
            return this.resourceLocations;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypes() {
            return this.resourceTypes;
        }

        @Override
        public final java.lang.Object getSchedule() {
            return this.schedule;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTargetTags() {
            return this.targetTags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getEventSource() != null) {
                data.set("eventSource", om.valueToTree(this.getEventSource()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPolicyType() != null) {
                data.set("policyType", om.valueToTree(this.getPolicyType()));
            }
            if (this.getResourceLocations() != null) {
                data.set("resourceLocations", om.valueToTree(this.getResourceLocations()));
            }
            if (this.getResourceTypes() != null) {
                data.set("resourceTypes", om.valueToTree(this.getResourceTypes()));
            }
            if (this.getSchedule() != null) {
                data.set("schedule", om.valueToTree(this.getSchedule()));
            }
            if (this.getTargetTags() != null) {
                data.set("targetTags", om.valueToTree(this.getTargetTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetails.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetails.Jsii$Proxy) o;

            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.eventSource != null ? !this.eventSource.equals(that.eventSource) : that.eventSource != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.policyType != null ? !this.policyType.equals(that.policyType) : that.policyType != null) return false;
            if (this.resourceLocations != null ? !this.resourceLocations.equals(that.resourceLocations) : that.resourceLocations != null) return false;
            if (this.resourceTypes != null ? !this.resourceTypes.equals(that.resourceTypes) : that.resourceTypes != null) return false;
            if (this.schedule != null ? !this.schedule.equals(that.schedule) : that.schedule != null) return false;
            return this.targetTags != null ? this.targetTags.equals(that.targetTags) : that.targetTags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action != null ? this.action.hashCode() : 0;
            result = 31 * result + (this.eventSource != null ? this.eventSource.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.policyType != null ? this.policyType.hashCode() : 0);
            result = 31 * result + (this.resourceLocations != null ? this.resourceLocations.hashCode() : 0);
            result = 31 * result + (this.resourceTypes != null ? this.resourceTypes.hashCode() : 0);
            result = 31 * result + (this.schedule != null ? this.schedule.hashCode() : 0);
            result = 31 * result + (this.targetTags != null ? this.targetTags.hashCode() : 0);
            return result;
        }
    }
}
