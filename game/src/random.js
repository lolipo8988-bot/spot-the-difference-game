// A small seeded random generator (mulberry32) so a scene paints the same
// way every time for a given seed, and the two panels of a scene agree on
// everything except the differences themselves.

/** Create a generator from an integer seed. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return {
    /** A float in [0, 1). */
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** An integer in [min, max). */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min));
    },
    /** A float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** Pick one item from an array. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
  };
}
