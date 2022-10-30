// Function to test correct DST operation. Keep until next change (Mar 2023)

function hasDST(date = new Date()) {
  const january = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const july = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();

  return Math.max(january, july) !== date.getTimezoneOffset();
}

function ecTest() {

    console.log(`Feb 1, 2022: `, hasDST(new Date(2022, 1, 1))); // 👉️ false
    console.log(`Sep 1, 2022: `, hasDST(new Date(2022, 8, 1))); // 👉️ true

    console.log(`Oct 30, 2022: `, hasDST(new Date(2022, 9, 30)));
    console.log(`Oct 31, 2022: `, hasDST(new Date(2022, 9, 31)));
    console.log(`Nov 1, 2022: `, hasDST(new Date(2022, 10, 1)));

    return;
}
