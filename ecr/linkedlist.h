#ifndef LINKED_LIST
#define LINKED_LIST

#include <stdio.h>
#include "debug.h"

/*
    This is a linked list element able to store any kind of data.
    The content is immutable within this class.
*/
class LinkedListElement {
    
    private:

        const void* content;
        LinkedListElement* next = nullptr;

    public:

        // Get the content of this element
        void* get() {
            return (void*)content;
        }

        // Get the next element pointer
        LinkedListElement* getNext() {
            return next;
        }

        // Set the next element pointer
        void setNext(LinkedListElement* data) {
            next = data;
        }

        // Constructor
        LinkedListElement(const void* data) {
            content = data;
        }

        // Destructor
        ~LinkedListElement() {
            // print("LinkedListElement: Destructor");
        }
};

class LinkedList {

    private:
        int size = 0;                          // the number of items
        LinkedListElement* head = nullptr;
        LinkedListElement* tail = nullptr;

    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the list)
        int getSize() {
            return size;
        };

        ///////////////////////////////////////////////////////////////////////
        void add(const void* data) {
            LinkedListElement* element = new LinkedListElement(data);
            if (size == 0) {
                head = element;
                tail = head;
            } else {
                tail->setNext(element);
                tail = element;
            }
            ++size;
        }

        ///////////////////////////////////////////////////////////////////////
        void* get(int index) {
            if (index < size) {
                LinkedListElement* element = head;
                while (index > 0) {
                    element = element->getNext();
                    --index;
                }
                return element->get();
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Clear the list. Remove everything except the element data.
        void clear() {
            LinkedListElement* thisElement = head;
            for (int n = 0; n < size; n++) {
                LinkedListElement* nextElement = thisElement->getNext();
                delete thisElement;
                thisElement = nextElement;
            }
            size = 0;
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the list
        void info() {
            print("LinkedList: size=%d\n", size);
        }

        // Default constructor
        LinkedList() {}

        // Destructor
        ~LinkedList() {
            clear();
            // print("LinkedList: Delete %s\n", name);
         }
};

#endif
