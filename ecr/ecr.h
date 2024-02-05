#ifndef ECR_H
#define ECR_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define NEWLINE (const char)'\n'

// A struct to hold an array of string buffers and the array size
struct StringArray {
  char** array;
  int size;
};

// Replace one character with another in situ
void replaceChar(char* string, char from, char to) {
  int len = strlen(string);
  for (int n = 0; n < len; n++) {
    if (string[n] == from) {
      string[n] = to;
    }
  }
}

// Find the position of a character inside a string
int strpos(char* haystack, char needle) {
  int len = strlen(haystack);
  for (int n = 0; n < len; n++) {
    if (haystack[n] == needle) {
      return n;
    }
  }
  return -1;
}

// Convert a string to an array of lines, using a specified delimiter.
StringArray* getLines(char* string, char delimiter) {
  int length = strlen(string);
  int nlines = 0;
  int start = 0;
  int pos = 0;

  // Count the number of lines.
  while (pos < length) {
    char c = string[pos];
    if (c == delimiter || c == '\0') {
      string[pos] = '\0';
      start = pos + 1;
      nlines++;
    }
    pos++;
  }
  if (start < pos) {
    ++nlines;
  }

  // Create an array of lines
  char** lines = (char**)malloc(nlines * sizeof(char*));
  pos = 0;
  int line = 0;
  while (pos < length) {
    int l = strlen(&string[pos]);
    lines[line] = (char*)malloc(l + 1);
    strcpy(lines[line++], &string[pos]);
    pos += l + 1;
  }

  struct StringArray* mylist = (struct StringArray*)malloc(sizeof(struct StringArray));

  mylist->array = lines;
  mylist->size = nlines;

  return mylist;
}

// Read a file and convert it into an array of strings
StringArray* readFile(char* filename) {
  FILE *f = fopen(filename, "rb");
  if (f == NULL) {
    printf("Could not read file %s\n", filename);
    return NULL;
  };
  
  fseek(f, 0, SEEK_END);
  long fsize = ftell(f);
  rewind(f);

  char* string = (char*)malloc(fsize + 1);
  if (string != NULL) {
    fread(string, fsize, 1, f);
    fclose(f);
    string[fsize] = 0;
  } else {
    printf("Could not allocate memory for %s\n", filename);
    return NULL;
  }

  // Convert the file to an array of lines
  StringArray* lines = getLines(string, NEWLINE);

  // Dispose of the original file
  free(string);
  return lines;
}


#endif