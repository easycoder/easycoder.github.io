# on

## Syntax:
`on message {action}`
## Example:
`on message go to HandleMessage`

## Description:
When another script uses `send {message} to {module}` (see [send](send.md)) to send this module a message (a text string), the message is saved and the designated `{action}` is invoked. The message text can be retrieved using `the message`.

Next: [open](open.md)  
Prev: [negate](negate.md)

[Back](../../README.md)
