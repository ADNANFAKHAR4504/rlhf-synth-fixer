package imports.aws.data_aws_ecr_lifecycle_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcrLifecyclePolicyDocument.DataAwsEcrLifecyclePolicyDocumentRuleSelection")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcrLifecyclePolicyDocumentRuleSelection.Jsii$Proxy.class)
public interface DataAwsEcrLifecyclePolicyDocumentRuleSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_number DataAwsEcrLifecyclePolicyDocument#count_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getCountNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_type DataAwsEcrLifecyclePolicyDocument#count_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCountType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_status DataAwsEcrLifecyclePolicyDocument#tag_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTagStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_unit DataAwsEcrLifecyclePolicyDocument#count_unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountUnit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_pattern_list DataAwsEcrLifecyclePolicyDocument#tag_pattern_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTagPatternList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_prefix_list DataAwsEcrLifecyclePolicyDocument#tag_prefix_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTagPrefixList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcrLifecyclePolicyDocumentRuleSelection> {
        java.lang.Number countNumber;
        java.lang.String countType;
        java.lang.String tagStatus;
        java.lang.String countUnit;
        java.util.List<java.lang.String> tagPatternList;
        java.util.List<java.lang.String> tagPrefixList;

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getCountNumber}
         * @param countNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_number DataAwsEcrLifecyclePolicyDocument#count_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder countNumber(java.lang.Number countNumber) {
            this.countNumber = countNumber;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getCountType}
         * @param countType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_type DataAwsEcrLifecyclePolicyDocument#count_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder countType(java.lang.String countType) {
            this.countType = countType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getTagStatus}
         * @param tagStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_status DataAwsEcrLifecyclePolicyDocument#tag_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder tagStatus(java.lang.String tagStatus) {
            this.tagStatus = tagStatus;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getCountUnit}
         * @param countUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#count_unit DataAwsEcrLifecyclePolicyDocument#count_unit}.
         * @return {@code this}
         */
        public Builder countUnit(java.lang.String countUnit) {
            this.countUnit = countUnit;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getTagPatternList}
         * @param tagPatternList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_pattern_list DataAwsEcrLifecyclePolicyDocument#tag_pattern_list}.
         * @return {@code this}
         */
        public Builder tagPatternList(java.util.List<java.lang.String> tagPatternList) {
            this.tagPatternList = tagPatternList;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection#getTagPrefixList}
         * @param tagPrefixList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#tag_prefix_list DataAwsEcrLifecyclePolicyDocument#tag_prefix_list}.
         * @return {@code this}
         */
        public Builder tagPrefixList(java.util.List<java.lang.String> tagPrefixList) {
            this.tagPrefixList = tagPrefixList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcrLifecyclePolicyDocumentRuleSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcrLifecyclePolicyDocumentRuleSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcrLifecyclePolicyDocumentRuleSelection {
        private final java.lang.Number countNumber;
        private final java.lang.String countType;
        private final java.lang.String tagStatus;
        private final java.lang.String countUnit;
        private final java.util.List<java.lang.String> tagPatternList;
        private final java.util.List<java.lang.String> tagPrefixList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.countNumber = software.amazon.jsii.Kernel.get(this, "countNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.countType = software.amazon.jsii.Kernel.get(this, "countType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagStatus = software.amazon.jsii.Kernel.get(this, "tagStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.countUnit = software.amazon.jsii.Kernel.get(this, "countUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagPatternList = software.amazon.jsii.Kernel.get(this, "tagPatternList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagPrefixList = software.amazon.jsii.Kernel.get(this, "tagPrefixList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.countNumber = java.util.Objects.requireNonNull(builder.countNumber, "countNumber is required");
            this.countType = java.util.Objects.requireNonNull(builder.countType, "countType is required");
            this.tagStatus = java.util.Objects.requireNonNull(builder.tagStatus, "tagStatus is required");
            this.countUnit = builder.countUnit;
            this.tagPatternList = builder.tagPatternList;
            this.tagPrefixList = builder.tagPrefixList;
        }

        @Override
        public final java.lang.Number getCountNumber() {
            return this.countNumber;
        }

        @Override
        public final java.lang.String getCountType() {
            return this.countType;
        }

        @Override
        public final java.lang.String getTagStatus() {
            return this.tagStatus;
        }

        @Override
        public final java.lang.String getCountUnit() {
            return this.countUnit;
        }

        @Override
        public final java.util.List<java.lang.String> getTagPatternList() {
            return this.tagPatternList;
        }

        @Override
        public final java.util.List<java.lang.String> getTagPrefixList() {
            return this.tagPrefixList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("countNumber", om.valueToTree(this.getCountNumber()));
            data.set("countType", om.valueToTree(this.getCountType()));
            data.set("tagStatus", om.valueToTree(this.getTagStatus()));
            if (this.getCountUnit() != null) {
                data.set("countUnit", om.valueToTree(this.getCountUnit()));
            }
            if (this.getTagPatternList() != null) {
                data.set("tagPatternList", om.valueToTree(this.getTagPatternList()));
            }
            if (this.getTagPrefixList() != null) {
                data.set("tagPrefixList", om.valueToTree(this.getTagPrefixList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcrLifecyclePolicyDocument.DataAwsEcrLifecyclePolicyDocumentRuleSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcrLifecyclePolicyDocumentRuleSelection.Jsii$Proxy that = (DataAwsEcrLifecyclePolicyDocumentRuleSelection.Jsii$Proxy) o;

            if (!countNumber.equals(that.countNumber)) return false;
            if (!countType.equals(that.countType)) return false;
            if (!tagStatus.equals(that.tagStatus)) return false;
            if (this.countUnit != null ? !this.countUnit.equals(that.countUnit) : that.countUnit != null) return false;
            if (this.tagPatternList != null ? !this.tagPatternList.equals(that.tagPatternList) : that.tagPatternList != null) return false;
            return this.tagPrefixList != null ? this.tagPrefixList.equals(that.tagPrefixList) : that.tagPrefixList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.countNumber.hashCode();
            result = 31 * result + (this.countType.hashCode());
            result = 31 * result + (this.tagStatus.hashCode());
            result = 31 * result + (this.countUnit != null ? this.countUnit.hashCode() : 0);
            result = 31 * result + (this.tagPatternList != null ? this.tagPatternList.hashCode() : 0);
            result = 31 * result + (this.tagPrefixList != null ? this.tagPrefixList.hashCode() : 0);
            return result;
        }
    }
}
