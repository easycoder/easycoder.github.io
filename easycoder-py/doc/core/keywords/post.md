# post

## Syntax:
`post {value} to {url} [giving {variable}] [or {command}]`

## Examples:
``post MyData to `https://myserver.com/rest` ``  
`post MyData to MyServer`  
`post stringify Data to MyServer giving Result`  
`` post `reset` to MyServer``  
`post MyData to MyServer or go to AbandonShip`

## Description:
Perform an HTTP PUT request with the specified data and endpoint, optionally saving the value that returns and optionally trapping a failure.

Next: [print](print.md)  
Prev: [pop](pop.md)

[Back](../../README.md)
