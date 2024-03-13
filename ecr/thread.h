class Thread {

    private:

        long time;                // the time at which this thread should run
        int pc;                   // the PC to run from

    public:

        ///////////////////////////////////////////////////////////////////////
        // Get the time of the Thread
        long getTime() {
            return time;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the PC of the Thread
        int getPC() {
            return pc;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Thread(long delay, int pc) {
            #ifdef _ARDUINO
            long millisecs = millis();
            #else
            struct timeval now;
            gettimeofday(&now, 0);
            long millisecs = now.tv_sec * 1000 + now.tv_usec / 1000;
            #endif
            time = millisecs + delay;
            this->pc = pc;
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Thread() {
            print("Thread: Destructor executed\n");
         }
};

// ThreadArray is a memory-efficient class for managing arrays of threads
// This implements a thread-queuing mechanism
class ThreadArray {

    private:
        
        int size = 0;                              // the number of threads
        Thread** threads = nullptr;                 // the array of threads
        LinkedList* list = new LinkedList();       // A list to hold new threads as they are added
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return this->size + list->getSize();
        };

        ///////////////////////////////////////////////////////////////////////
        // Get a thread from the array.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Thread* get(int n) {
            if (n < size) {
                return threads[n];
            }
            else if (n < size + list->getSize()) {
                return (Thread*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Thread** oldArray = threads;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                threads = new Thread*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    // print("Copying item %d: %s\n", size, get(size));
                    threads[size] = oldArray[size];
                    size++;
                }
                if (oldArray != nullptr) {
                    delete[] oldArray;
                }
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    // print("Moving item %d: %s\n", n, (char*)list->get(n));
                    threads[size++] = (Thread*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a thread. This goes into the linked list.
        void add(Thread* t) {
            list->add(t);
        }

        ///////////////////////////////////////////////////////////////////////
        // Remove a thread.
        void remove(Thread* t) {
            flatten();
            for (int n = 0; n < size; n++) {
                if (threads[n] == t) {
                    Thread** tt = new Thread*[size - 1];
                    for (int i = 0, j = 0; i < size; i++) {
                        if (threads[i] != t) {
                            tt[j++] = threads[i];
                        }
                    }
                    delete[] threads;
                    threads = tt;
                    --size;
                    break;
                }
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the PC of the next thread due for execution
        int getNextThread() {
            flatten();
            #ifdef _ARDUINO
            long millisecs = millis();
            #else
            struct timeval now;
            gettimeofday(&now, 0);
            long millisecs = now.tv_sec * 1000 + now.tv_usec / 1000;
            #endif
            // Look for the first thread that's due to run now.
            for (int n = 0; n < size; n++) {
                Thread* thread = get(n);
                if (thread->getTime() < millisecs) {
                    int pc = thread->getPC();
                    remove(thread);
                    return pc;
                }
            }
            // No threads ready to go now, so look for a scheduled one
            // and sleep till it's due to run.
            for (int n = 0; n < size; n++) {
                Thread* thread = get(n);
                long target = thread->getTime();
                // printf("Sleep for %ld millisecs\n", target - millisecs + 1);
                Sleep(target - millisecs + 1);
                break;
            }
            return STOPPED;
        };

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("ThreadArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {}

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        ThreadArray() {}

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~ThreadArray() {
            if (size > 0) {
                delete threads;
                threads = nullptr;
            }
            delete list;
            list = nullptr;

            #if DESTROY
            print("ThreadArray: Delete %s\n", name);
            #endif
        }
};
