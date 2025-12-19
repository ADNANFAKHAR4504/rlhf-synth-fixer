from aws_cdk import IAspect, Tags
from constructs import IConstruct
import jsii


@jsii.implements(IAspect)
class MandatoryTagsAspect:
    """CDK Aspect to enforce mandatory tags on all resources"""

    def __init__(self, required_tags: dict):
        self.required_tags = required_tags

    def visit(self, node: IConstruct) -> None:
        """Visit each construct and apply mandatory tags"""
        # Apply tags to all taggable resources
        for tag_key, tag_value in self.required_tags.items():
            Tags.of(node).add(tag_key, tag_value)
