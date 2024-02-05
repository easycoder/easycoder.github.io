#ifndef DEBUG_H
#define DEBUG_H

#include "ecr.h"

int debug(StringArray* codes, StringArray* keys) {
  // Decode the files and print for inspection
  for (int pc = 0; pc < codes->size; pc++) {
    printf("PC = %d, code = %s\n", pc, codes->array[pc]);
    StringArray* items = getLines(codes->array[pc], ',');
    for (int n = 0; n < items->size; n++) {
      char* item = items->array[n];
      int p = strpos(item, ':');
      if (p >= 0) {
        char* key = (char*)malloc(p + 1);
        strncpy(key, item, p);
        char* value = (char*)malloc(strlen(item) - p);
        strcpy(value, item + p + 1);
        if (value[0] == '[') {
            printf("%s:[\n", keys->array[atoi(key)]);
        }
        else if (value[0] == '{') {
            printf("%s:{\n", keys->array[atoi(key)]);
        } else {
          printf("%s:%s\n", keys->array[atoi(key)], keys->array[atoi(value)]);
        }
      }
      else if (item[0] == ']') {
        printf("]\n");
      }
      else if (item[0] == '}') {
        printf("}\n");
      } else if (item[0] == '#') {
        printf("%d\n", atoi(item + 1));
      } else {
        printf("%s\n", keys->array[atoi(item)]);
      }
    }
  }
  return 0;
}

#endif