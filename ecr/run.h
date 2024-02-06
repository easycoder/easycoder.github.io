#ifndef RUN_H
#define RUN_H

#include "ecr.h"
#include "domain/core/core-keywords.h"

char* command = (char*)malloc(1);

int runOneCommand(char* cmd, StringArray* keys){
    command = (char*)realloc(command, strlen(cmd));
    strcpy(command, cmd);
    printf("%s\n", command);
    StringArray* items = getLines(command, ',');
    printf("%d\n", items->size);
    return 0;
}

int run(StringArray* codes, StringArray* keys) {
    printf("Run the program\n");
    CoreKeywords core;
    char* command = codes->array[0];
    runOneCommand(command, keys);
    return 0;
}

#endif