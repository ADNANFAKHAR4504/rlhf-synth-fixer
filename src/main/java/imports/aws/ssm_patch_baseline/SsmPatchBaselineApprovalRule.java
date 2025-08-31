package imports.aws.ssm_patch_baseline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmPatchBaseline.SsmPatchBaselineApprovalRule")
@software.amazon.jsii.Jsii.Proxy(SsmPatchBaselineApprovalRule.Jsii$Proxy.class)
public interface SsmPatchBaselineApprovalRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * patch_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#patch_filter SsmPatchBaseline#patch_filter}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPatchFilter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approve_after_days SsmPatchBaseline#approve_after_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getApproveAfterDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approve_until_date SsmPatchBaseline#approve_until_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApproveUntilDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#compliance_level SsmPatchBaseline#compliance_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComplianceLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#enable_non_security SsmPatchBaseline#enable_non_security}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableNonSecurity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmPatchBaselineApprovalRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmPatchBaselineApprovalRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmPatchBaselineApprovalRule> {
        java.lang.Object patchFilter;
        java.lang.Number approveAfterDays;
        java.lang.String approveUntilDate;
        java.lang.String complianceLevel;
        java.lang.Object enableNonSecurity;

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getPatchFilter}
         * @param patchFilter patch_filter block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#patch_filter SsmPatchBaseline#patch_filter}
         * @return {@code this}
         */
        public Builder patchFilter(com.hashicorp.cdktf.IResolvable patchFilter) {
            this.patchFilter = patchFilter;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getPatchFilter}
         * @param patchFilter patch_filter block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#patch_filter SsmPatchBaseline#patch_filter}
         * @return {@code this}
         */
        public Builder patchFilter(java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilter> patchFilter) {
            this.patchFilter = patchFilter;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getApproveAfterDays}
         * @param approveAfterDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approve_after_days SsmPatchBaseline#approve_after_days}.
         * @return {@code this}
         */
        public Builder approveAfterDays(java.lang.Number approveAfterDays) {
            this.approveAfterDays = approveAfterDays;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getApproveUntilDate}
         * @param approveUntilDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approve_until_date SsmPatchBaseline#approve_until_date}.
         * @return {@code this}
         */
        public Builder approveUntilDate(java.lang.String approveUntilDate) {
            this.approveUntilDate = approveUntilDate;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getComplianceLevel}
         * @param complianceLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#compliance_level SsmPatchBaseline#compliance_level}.
         * @return {@code this}
         */
        public Builder complianceLevel(java.lang.String complianceLevel) {
            this.complianceLevel = complianceLevel;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getEnableNonSecurity}
         * @param enableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#enable_non_security SsmPatchBaseline#enable_non_security}.
         * @return {@code this}
         */
        public Builder enableNonSecurity(java.lang.Boolean enableNonSecurity) {
            this.enableNonSecurity = enableNonSecurity;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineApprovalRule#getEnableNonSecurity}
         * @param enableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#enable_non_security SsmPatchBaseline#enable_non_security}.
         * @return {@code this}
         */
        public Builder enableNonSecurity(com.hashicorp.cdktf.IResolvable enableNonSecurity) {
            this.enableNonSecurity = enableNonSecurity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmPatchBaselineApprovalRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmPatchBaselineApprovalRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmPatchBaselineApprovalRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmPatchBaselineApprovalRule {
        private final java.lang.Object patchFilter;
        private final java.lang.Number approveAfterDays;
        private final java.lang.String approveUntilDate;
        private final java.lang.String complianceLevel;
        private final java.lang.Object enableNonSecurity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.patchFilter = software.amazon.jsii.Kernel.get(this, "patchFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.approveAfterDays = software.amazon.jsii.Kernel.get(this, "approveAfterDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.approveUntilDate = software.amazon.jsii.Kernel.get(this, "approveUntilDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.complianceLevel = software.amazon.jsii.Kernel.get(this, "complianceLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableNonSecurity = software.amazon.jsii.Kernel.get(this, "enableNonSecurity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.patchFilter = java.util.Objects.requireNonNull(builder.patchFilter, "patchFilter is required");
            this.approveAfterDays = builder.approveAfterDays;
            this.approveUntilDate = builder.approveUntilDate;
            this.complianceLevel = builder.complianceLevel;
            this.enableNonSecurity = builder.enableNonSecurity;
        }

        @Override
        public final java.lang.Object getPatchFilter() {
            return this.patchFilter;
        }

        @Override
        public final java.lang.Number getApproveAfterDays() {
            return this.approveAfterDays;
        }

        @Override
        public final java.lang.String getApproveUntilDate() {
            return this.approveUntilDate;
        }

        @Override
        public final java.lang.String getComplianceLevel() {
            return this.complianceLevel;
        }

        @Override
        public final java.lang.Object getEnableNonSecurity() {
            return this.enableNonSecurity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("patchFilter", om.valueToTree(this.getPatchFilter()));
            if (this.getApproveAfterDays() != null) {
                data.set("approveAfterDays", om.valueToTree(this.getApproveAfterDays()));
            }
            if (this.getApproveUntilDate() != null) {
                data.set("approveUntilDate", om.valueToTree(this.getApproveUntilDate()));
            }
            if (this.getComplianceLevel() != null) {
                data.set("complianceLevel", om.valueToTree(this.getComplianceLevel()));
            }
            if (this.getEnableNonSecurity() != null) {
                data.set("enableNonSecurity", om.valueToTree(this.getEnableNonSecurity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmPatchBaseline.SsmPatchBaselineApprovalRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmPatchBaselineApprovalRule.Jsii$Proxy that = (SsmPatchBaselineApprovalRule.Jsii$Proxy) o;

            if (!patchFilter.equals(that.patchFilter)) return false;
            if (this.approveAfterDays != null ? !this.approveAfterDays.equals(that.approveAfterDays) : that.approveAfterDays != null) return false;
            if (this.approveUntilDate != null ? !this.approveUntilDate.equals(that.approveUntilDate) : that.approveUntilDate != null) return false;
            if (this.complianceLevel != null ? !this.complianceLevel.equals(that.complianceLevel) : that.complianceLevel != null) return false;
            return this.enableNonSecurity != null ? this.enableNonSecurity.equals(that.enableNonSecurity) : that.enableNonSecurity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.patchFilter.hashCode();
            result = 31 * result + (this.approveAfterDays != null ? this.approveAfterDays.hashCode() : 0);
            result = 31 * result + (this.approveUntilDate != null ? this.approveUntilDate.hashCode() : 0);
            result = 31 * result + (this.complianceLevel != null ? this.complianceLevel.hashCode() : 0);
            result = 31 * result + (this.enableNonSecurity != null ? this.enableNonSecurity.hashCode() : 0);
            return result;
        }
    }
}
