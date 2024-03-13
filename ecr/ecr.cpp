#define DEBUG 1       // set to 1 to show debug messages
#define DESTROY 0     // set to 1 to show destructors
#define LINENUMBERS 0 // set to 1 to show each line number
#define _LINUX
//#define _WINDOWS
//#define _ARDUINO

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <sys/time.h>
#ifdef _LINUX
#include <unistd.h>
#define Sleep(x) usleep((x)*1000)
#endif
#ifdef _WINDOWS
#include <windows.h>
#endif
#ifdef _ARDUINO
#define Sleep(x) delay((x))
#endif
#include "debug.h"
#include "definitions.h"
#include "linkedlist.h"
#include "text.h"
#include "element.h"
#include "keyword.h"
#include "runtimevalue.h"
#include "condition.h"
#include "symbol.h"
#include "thread.h"
#include "functions.h"
#include "core-values.h"
#include "core-conditions.h"
#include "command.h"
#include "runtime.h"
#include "core-keywords.h"
#include "run.h"

// Main program
int main(int argc, char* argv[])
{
    printf("C++ version %ld\n", __cplusplus);
    char* ptr1;
    char* ptr2;
    int count = 0;

    char* filename = (char*)"test.eco"; // During development

    FILE *f = fopen(filename, "rb");
    if (f == NULL) {
      print("Could not read file %s\n", filename);
      return 1;
    }
    
    // Get the size of the file
    fseek(f, 0, SEEK_END);
    long fsize = ftell(f);
    rewind(f);

    // Read the file as a single chunk
    char* script = new char[fsize + 1];
    if (script != NULL) {
      fread(script, fsize, 1, f);
      fclose(f);
      script[fsize] = 0;
    } else {
      print("Could not allocate memory for %s\n", filename);
      return 1;
    };

    // Split the code and key portions
    // Codes end with an empty line
    // Keys end with another empty line
    int n = 0;
    int m;
    while (1) {
        m = n;
        for (; script[n] != '\n'; n++) {}
        if (n == m) {
          break;
        }
        n++;
    }
    script[n++] = '\0';
    Text* codes = new Text(script);
    char* keyStart = &script[n];
    while (1) {
        m = n;
        for (; script[n] != '\n'; n++) {}
        if (n == m) {
          break;
        }
        n++;
    }
    script[n] = '\0';
    Text* keys = new Text(keyStart);
    delete[] script;
    script = nullptr;

    // print("codes: %s", codes->getText());
    // print("keys: %s", keys->getText());

    Run runner = Run(codes, keys);

    return 0;
};
