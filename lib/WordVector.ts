"use strict";

/**
 * Represents a Word Vector.
 * @param {string} word - the word the vector represents
 * @param {Array} values - elements of the word vector
 * @constructor
 */

class WordVec {
  word: string;
  values: [number];
  constructor(word: string, values: [number]) {
    this.word = word;
    this.values = values;
    return this;
  }
  /**
   * Add another word vector to the current word vector.
   * @param {WordVec} word - another WordVector
   * @returns {WordVec} result of the addition
   */
  add(word: WordVec): WordVec {
    var i, values, len;

    len = this.values.length;
    values = new Array(len);
    for (i = 0; i < this.values.length; i++) {
      values[i] = this.values[i] + word.values[i];
    }
    return new WordVec(null, values);
  }
  /**
   * Subtract another word vector from the current word vector.
   * @param {WordVec} word - another WordVector
   * @returns {WordVec} result of the subtraction
   */
  subtract(word: WordVec): WordVec {
    var i, values, len;

    len = this.values.length;
    values = new Array(len);
    for (i = 0; i < this.values.length; i++) {
      values[i] = this.values[i] - word.values[i];
    }
    return new WordVec(null, values);
  }
}

// EXPORTS //

export default WordVec;
