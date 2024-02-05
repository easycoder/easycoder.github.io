#include "ecr.h"
#include "debug.h"
#include "run.h"

// Main program
int main(void)
{
  // Read the code file into memory as an array of lines
  StringArray* codes = readFile((char*)"test.code");
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

  // debug(codes, keys);

  int result = run(codes, keys);

  return result;
}