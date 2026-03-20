# datime

## Syntax:
`datime {timestamp} [format {format string}`]

## Examples:
`print datime now`  
`print datime 1735689600000 format \`%b %d %H:%M:%S\``  
`print datime now format Format`

## Description:
Gets a formatted time and date string from a millisecond timestamp (milliseconds since Jan 1, 1970). The format string is that used by the Python `datetime` command, and defaults to `%b %d %Y %H:%M:%S`. See [here](https://www.w3schools.com/python/python_datetime.asp) for a a list of format specifiers. See also [now](now.md) and [timestamp](timestamp.md).

Next: [decode](decode.md)  
Prev: [cos](cos.md)

[Back](../../README.md)
