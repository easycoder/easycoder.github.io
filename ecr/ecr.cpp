#include "ecr.h"
#include "debug.h"
#include "run.h"

// Main program
int main(void)
{
  char* filename = (char*)"test.eco"; // During development

  FILE *f = fopen(filename, "rb");
  if (f == NULL) {
    printf("Could not read file %s\n", filename);
    return 1;
  }
  
  // Get the size of the file
  fseek(f, 0, SEEK_END);
  long fsize = ftell(f);
  rewind(f);

  // Read the file as a single chunk
  char* string = (char*)malloc(fsize + 1);
  if (string != NULL) {
    fread(string, fsize, 1, f);
    fclose(f);
    string[fsize] = 0;
  } else {
    printf("Could not allocate memory for %s\n", filename);
    return 1;
  }

  // Split the code and key portions
  char* codes;
  char* keys;
  char* keywords;
  int codeCount = 0;
  int keyCount = 0;
  int codeSize;
  int keySize;
  int count = 0;
  int size = 0;

  char* token = strtok(string, "\n");
  while (token != NULL) {
    if (strcmp(token, (char*)"-") == 0) {
      // When - is reached, convert to a list of codes
      codeCount = count;
      codeSize = size;
      codes = (char*)malloc(++codeSize);
      memcpy(codes, string, codeSize);
      // Reset the scanner for the keyword list
      keywords = string + codeSize + 1;
      count = 0;
      size = 0;
      token = strtok(keywords, "\n");
    } else if (strcmp(token, (char*)"--") == 0) {
      // When -- is reached, convert to a list of keywords
      keyCount = count;
      keySize = size;
      keys = (char*)malloc(++keySize);
      memcpy(keys, keywords, keySize);
      token = strtok(NULL, "\n");
    } else {
      // printf("%s\n", token);
      count++;
      size += strlen(token) +1;
      token = strtok(NULL, "\n");
    }
  }
  // Build a StringArray for each part
  
  char* ptr = codes;
  for (int n = 0; n < codeCount; n++) {
    printf("%s\n", ptr);

    ptr += strlen(ptr) + 1;
  }
  printf("-\n");
  ptr = keys;
  for (int n = 0; n < keyCount; n++) {
    printf("%s\n", ptr);
    ptr += strlen(ptr) + 1;
  }

  // Convert the file to an array of lines
  // StringArray* lines = getLines(string, NEWLINE);

  // Dispose of the original file
  free(string);




  
/*
  // Read the compiled script into memory as an array of lines
  StringArray* codes = readFile((char*)"test.eco");
  if (codes == NULL) {
    return 1;
  }
  printf("Code lines: %d\n", codes->size);

  // Read the key file into memory as an array of lines
  StringArray* keys = readFile((char*)"test.keys");
  if (keys == NULL) {
    return 1;
  }
  printf("Keys: %d\n", keys->size);
*/

  // debug(codes, keys);

  // int result = run(codes, keys);

  // return result;

  return 0;
}