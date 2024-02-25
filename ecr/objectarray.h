#ifndef OBJECTARRAY
#define OBJECTARRAY

#include "debug.h"

/*
    ObjectArray is a memory-efficient class for managing arrays of arbitrary objects.
*/
class ObjectArray {

    private:
        void* content;          // A mutable copy of the original data
        int size = 0;           // the number of items
        void** array;           // the array of items
        LinkedList* list;       // A list to hold new data items as they are added
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array)
        int getSize() {
            return this->size;
        };

        ///////////////////////////////////////////////////////////////////////
        // Get a specified item.
        // If the index is greater than the array size, return the item from the list.
        void* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (void*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Add an item. This goes into the linked list.
        void add(const void* item) {
            list->add(item);
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            void** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new void**[sizeof(ObjectArray*) * (total)];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    // debug("Copying item %d: %s\n", size, get(size));
                    array[size] = oldArray[size];
                    size++;
                }
                delete oldArray;
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    // debug("Moving item %d: %s\n", n, list->get(n));
                    array[size++] = list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        ObjectArray() {
            list = new LinkedList();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~ObjectArray() {
            delete list;
            debug("StringArray: Destructor executed\n");
         }
};

#endif
