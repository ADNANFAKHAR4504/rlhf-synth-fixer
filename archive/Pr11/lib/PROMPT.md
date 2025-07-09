Create a Rest API that connects directly from Api Gateway's Rest API to DynamoDB. Considerations:

* Framework: AWS CDK (ts),
* GET -> GetItem
* PUT -> PutItem
* PATCH -> UpdateItem
* DELETE -> UpdateItem(only deleted field)
* Auth: ApiKey
* Generate two api keys:
  * apiKey1 -> ReadOnly: Allow GET
  * apiKey2 -> Admin: Allow *.

* Create a Payload validation for ApiGateway request to match this jsonSCHEMA:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Turn Around Prompt Schema",
  "description": "Schema for turn around prompt objects",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the turn around prompt",
      "pattern": "^TAP-\\d+$",
      "examples": ["TAP-1", "TAP-2", "TAP-100"]
    },
    "name": {
      "type": "string",
      "description": "Display name for the turn around prompt",
      "minLength": 1,
      "maxLength": 255,
      "examples": ["First turn around prompt", "Second turn around prompt"]
    },
    "status": {
      "type": "string",
      "description": "Current status of the turn around prompt",
      "enum": ["active", "inactive", "pending", "completed"],
      "examples": ["active", "inactive", "pending", "completed"]
    },
    "deleted": {
      "type": "boolean",
      "description": "Indicates whether the turn around prompt has been deleted",
      "default": false,
      "examples": [false, true]
    }
  },
  "required": ["id", "name"],
  "additionalProperties": false
}
```