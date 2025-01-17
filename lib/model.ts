"use strict";

// MODULES //

import * as fs from "fs";
import * as readline from "readline";
import * as Stream from "stream";
import * as mime from "mime";
import * as _ from "underscore";
import * as path from "path";
import WordVec from "./WordVector";

function normalize(values: [number]) {
  var a;
  var vec = values;
  var size = values.length;
  var len = 0;

  for (a = 0; a < size; a++) {
    len += vec[a] * vec[a];
  }
  len = Math.sqrt(len);
  for (a = 0; a < size; a++) {
    vec[a] /= len;
  }

  return vec;
}

class Model {
  public vocab: WordVec[];
  public words: number;
  public size: number;
  constructor() {
    this.vocab = [];
    this.words = 0;
    this.size = 0;
    return this;
  }
  getVector(word: string) {
    for (var i = 0; i < this.words; i++) {
      if (this.vocab[i].word === word) {
        return this.vocab[i];
      }
    }
    return null;
  }
  getVectors(words: [string]) {
    if (!words) {
      return this.vocab;
    } else {
      return this.vocab.filter(function onElement(w) {
        return _.contains(words, w.word);
      });
    }
  }
  similarity(word1: string, word2: string) {
    var vecs = [];
    var sum;
    var i;
    for (i = 0; i < this.words; i++) {
      if (this.vocab[i].word === word1 || this.vocab[i].word === word2) {
        vecs.push(this.vocab[i].values);
      }
    }
    if (vecs.length === 2) {
      sum = 0;
      for (i = 0; i < this.size; i++) {
        sum += vecs[0][i] * vecs[1][i];
      }
      return sum;
    } else if (vecs.length === 1 && word1 === word2) {
      // Case: word1 and word2 are identical:
      return 1.0;
    }
    // Case: At least one of the words is not available in vocabulary:
    return null;
  }
  getNearestWord(vec) {
    var bestw;
    var bestd;
    var c;
    var a;

    if (vec instanceof WordVec === true) {
      vec = vec.values;
    }
    vec = normalize(vec);

    for (c = 0; c < this.words; c++) {
      var dist = 0;
      for (a = 0; a < this.size; a++) {
        dist += vec[a] * this.vocab[c].values[a];
      }
      if (c === 0 || dist > bestd) {
        bestd = dist;
        bestw = this.vocab[c].word;
      }
    }

    var o: { word: string; dist: number } = { word: "", dist: 0 };
    o.word = bestw;
    o.dist = bestd;
    return o;
  }

  getNearestWords(vec, N_input) {
    var bestd;
    var bestw;
    var dist;
    var ret;
    var d;
    var i;
    var c;
    var a;

    let N = N_input || 10;
    if (vec instanceof WordVec === true) {
      vec = vec.values;
    }
    vec = normalize(vec);

    bestw = new Array(N);
    bestd = Array.apply(null, new Array(N)).map(Number.prototype.valueOf, -1);

    for (c = 0; c < this.words; c++) {
      dist = 0;
      for (a = 0; a < this.size; a++) {
        dist += vec[a] * this.vocab[c].values[a];
      }
      for (a = 0; a < N; a++) {
        if (dist > bestd[a]) {
          for (d = N - 1; d > a; d--) {
            bestd[d] = bestd[d - 1];
            bestw[d] = bestw[d - 1];
          }
          bestd[a] = dist;
          bestw[a] = this.vocab[c].word;
          break;
        }
      }
    }

    ret = [];
    for (i = 0; i < N; i++) {
      var o: { word: string; dist: number } = { word: "", dist: 0 };
      o.word = bestw[i];
      o.dist = bestd[i];
      ret[i] = o;
    }
    return ret;
  }

  mostSimilar(input_phrase, N_input) {
    var phrase_words;
    var phrase;
    var bestw;
    var bestd;
    var found;
    var dist;
    var vec;
    var len;
    var cn;
    var a;
    var b;
    var c;
    var i;
    var d;
    var o;

    var N = N_input || 40;
    phrase = {
      words: [],
      output: {},
    };
    phrase_words = input_phrase.split(" ");

    for (i = 0; i < phrase_words.length; i++) {
      o = {
        word: phrase_words[i],
        pos: -1,
      };
      phrase.words.push(o);
    }

    bestw = new Array(N);
    bestd = Array.apply(null, new Array(N)).map(Number.prototype.valueOf, -1);
    cn = phrase.words.length;
    // Boolean checking whether at least one phrase word is in dictionary...
    found = false;
    for (a = 0; a < cn; a++) {
      for (b = 0; b < this.words; b++) {
        if (phrase.words[a].word === this.vocab[b].word) {
          found = true;
          phrase.words[a].pos = b;
          break;
        }
      }
      if (phrase.words[a].pos === -1) {
        console.log("Out of dictionary word: " + phrase.words[a].word + "\n");
      }
    }

    if (found === false) {
      // All words are out-of-dictionary, return `null`:
      return null;
    }

    vec = [];
    for (i = 0; i < this.size; i++) {
      vec[i] = 0;
    }
    for (b = 0; b < cn; b++) {
      if (phrase.words[b].pos !== -1) {
        for (a = 0; a < this.size; a++) {
          vec[a] += this.vocab[phrase.words[b].pos].values[a];
        }
      }
    }

    // Normalizing vector vec...
    len = 0;
    for (a = 0; a < this.size; a++) {
      len += vec[a] * vec[a];
    }
    len = Math.sqrt(len);
    for (a = 0; a < this.size; a++) {
      vec[a] = vec[a] / len;
    }

    // Iterate through vocabulary...
    for (c = 0; c < this.words; c++) {
      a = 0;
      for (b = 0; b < cn; b++) {
        if (phrase.words[b].pos === c) {
          a = 1;
        }
      }
      if (a !== 1) {
        dist = 0;
        for (a = 0; a < this.size; a++) {
          dist += vec[a] * this.vocab[c].values[a];
        }
        for (a = 0; a < N; a++) {
          if (dist > bestd[a]) {
            for (d = N - 1; d > a; d--) {
              bestd[d] = bestd[d - 1];
              bestw[d] = bestw[d - 1];
            }
            bestd[a] = dist;
            bestw[a] = this.vocab[c].word;
            break;
          }
        }
      }
    }

    var ret = [];
    for (i = 0; i < N; i++) {
      o = {};
      o.word = bestw[i];
      o.dist = bestd[i];
      ret[i] = o;
    }
    return ret;
  }

  analogy(word, pair, N_input) {
    var phrase;
    var bestw;
    var bestd;
    var ret;
    var vec;
    var bi;
    var cn;
    var a;
    var b;
    var d;
    var i;
    var o;

    var N = N_input || 40;
    if (_.isString(word) === false) {
      throw new TypeError("Word of interest has to be supplied as string.");
    }
    if (_.isArray(pair) === false) {
      throw new TypeError("Word pair has to be supplied in string Array.");
    }
    phrase = {
      words: pair,
      output: {},
    };

    phrase.words.push(word);
    phrase.words = phrase.words.map(function (word) {
      o = {};
      o.word = word;
      o.pos = -1;
      return o;
    });

    bestw = new Array(N);
    bestd = Array.apply(null, new Array(N)).map(Number.prototype.valueOf, 0);
    cn = phrase.words.length;
    bi = phrase.words;
    vec = Array.apply(null, new Array(this.size)).map(
      Number.prototype.valueOf,
      0
    );

    for (a = 0; a < cn; a++) {
      for (b = 0; b < this.words; b++) {
        if (phrase.words[a].word === this.vocab[b].word) {
          phrase.words[a].pos = b;
          break;
        }
      }
      if (phrase.words[a].pos === -1) {
        console.log("Out of dictionary word: " + phrase.words[a].word + "\n");
        break;
      }
    }

    for (b = 0; b < cn; b++) {
      if (phrase.words[b].pos !== -1) {
        for (a = 0; a < this.size; a++) {
          vec[a] += this.vocab[phrase.words[b].pos].values[a];
        }
      }
    }

    for (a = 0; a < this.size; a++) {
      vec[a] =
        this.vocab[bi[1].pos].values[a] -
        this.vocab[bi[0].pos].values[a] +
        this.vocab[bi[2].pos].values[a];
    }

    var len = 0;
    for (a = 0; a < this.size; a++) {
      len += vec[a] * vec[a];
    }
    len = Math.sqrt(len);
    for (a = 0; a < this.size; a++) {
      vec[a] /= len;
    }

    for (var c = 0; c < this.words; c++) {
      if (c === bi[0].pos) {
        continue;
      }
      if (c === bi[1].pos) {
        continue;
      }
      if (c === bi[2].pos) {
        continue;
      }
      a = 0;
      for (b = 0; b < cn; b++) {
        if (bi[b].pos === c) {
          a = 1;
        }
      }
      if (a === 1) {
        continue;
      }
      var dist = 0;
      for (a = 0; a < this.size; a++) {
        dist += vec[a] * this.vocab[c].values[a];
      }
      for (a = 0; a < N; a++) {
        if (dist > bestd[a]) {
          for (d = N - 1; d > a; d--) {
            bestd[d] = bestd[d - 1];
            bestw[d] = bestw[d - 1];
          }
          bestd[a] = dist;
          bestw[a] = this.vocab[c].word;
          break;
        }
      }
    }

    ret = [];
    for (i = 0; i < N; i++) {
      o = {};
      o.word = bestw[i];
      o.dist = bestd[i];
      ret[i] = o;
    }
    return ret;
  }
}

function loadModel(file: string, callback) {
  var model = new Model();
  var err = null;
  var N; // number of closest words that will be shown

  if (typeof file !== "string") {
    throw new TypeError("Function expects file name as its first parameter.");
  }
  file = path.resolve(process.cwd(), file);

  if (callback === undefined) {
    callback = function () {};
  }

  function init(file) {
    var mime_type = mime.getType(file);
    switch (mime_type) {
      case "text/plain":
        readTxt(file);
        break;
    }
  }
  init(file);

  function readTxt(file) {
    var instream = fs.createReadStream(file);
    // var outstream = new Stream();
    // var rl = readline.createInterface(instream, outstream);
    var rl = readline.createInterface(instream);
    var counter = 0;

    rl.on("line", function (line) {
      var values;
      var word;
      var arr;
      var len;
      var val;
      var a;
      var i;
      var o;

      if (counter === 0) {
        arr = line.split(" ");
        model.words = arr[0];
        model.size = arr[1];
        if (isNaN(model.words) || isNaN(model.size)) {
          throw new Error(
            "First line of text file has to be <number of words> <length of vector>."
          );
        }
      } else {
        arr = line.split(" ");
        word = arr[0];

        values = new Float32Array(model.size);
        for (i = 1; i < arr.length; i++) {
          val = arr[i];
          if (val !== "") {
            values[i - 1] = parseFloat(val);
          }
        }
        o = new WordVec(word, values);

        len = 0;
        for (a = 0; a < model.size; a++) {
          len += o.values[a] * o.values[a];
        }
        len = Math.sqrt(len);
        for (a = 0; a < model.size; a++) {
          o.values[a] /= len;
        }
        model.vocab.push(o);
      }
      counter++;
    });
    rl.on("close", function () {
      callback(err, model);
    });
  }
}

// LOAD MODEL //

export default loadModel;
