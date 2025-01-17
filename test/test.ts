"use strict";

// MODULES //

import * as main from "../lib/index";
import { expect } from "chai";
import * as path from "path";

// FIXTURES //

var file = path.normalize(__dirname + "/fixtures/test.txt");
var fileBin = path.normalize(__dirname + "/fixtures/test.bin");
var vectors = path.normalize(__dirname + "/fixtures/vectors.txt");
var phrases = path.normalize(__dirname + "/fixtures/phrases.txt");
var input = path.normalize(__dirname + "/fixtures/input.txt");

// TESTS //

describe("loadModel", function tests() {
  it("is a callable function", function test() {
    expect(main.loadModel).to.be.a("function");
  });

  it("should throw an error if not provided a string for filename", function test() {
    var values = [5, null, undefined, NaN, true, [], {}, function () {}];

    for (var i = 0; i < values.length; i++) {
      expect(badValue(values[i])).to.throw(Error);
    }
    function badValue(value) {
      return function () {
        main.loadModel(value, () => {});
      };
    }
  });

  it("successfully loads a model file", function test() {
    main.loadModel(file, function (err) {
      expect(err).to.be.null;
    });
  });

  describe(".getVector()", function tests() {
    it("retrieves the vector for a given word", function test() {
      main.loadModel(file, function (err, model) {
        var wordVec = model.getVector("church");
        expect(wordVec).to.be.a("object");
        expect(wordVec).to.have.ownProperty("word");
        expect(wordVec).to.have.ownProperty("values");
      });
    });
  });

  describe(".getVectors()", function tests() {
    it("retrieves the vectors for the given word list", function test(done) {
      main.loadModel(file, function (err, model) {
        var wordVecArr = model.getVectors(["and", "or"]);
        expect(wordVecArr).to.be.a("array");
        expect(wordVecArr).to.have.property("length");
        expect(wordVecArr[0]).to.have.ownProperty("word");
        expect(wordVecArr[0]).to.have.ownProperty("values");
        done();
      });
    });
  });

  describe(".getNearestWord()", function tests() {
    it("retrieves the nearest word for the input word vector", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.getNearestWord(model.getVector("and"));
        expect(res).to.have.ownProperty("word");
        expect(res).to.have.ownProperty("dist");
        done();
      });
    });
  });

  describe(".getNearestWords()", function tests() {
    it("retrieves the nearest words for the input word vector", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.getNearestWords(model.getVector("and"), 3);
        expect(res).to.be.a("array");
        expect(res).to.have.length(3);
        expect(res[0]).to.have.ownProperty("word");
        expect(res[0]).to.have.ownProperty("dist");
        done();
      });
    });
  });

  describe(".mostSimilar()", function tests() {
    it("retrieves the words most similar to the input word", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.mostSimilar("population", 20);
        expect(res).to.be.a("array");
        expect(res).to.have.length(20);
        expect(res[0]).to.have.ownProperty("word");
        expect(res[0]).to.have.ownProperty("dist");
        done();
      });
    });
  });

  describe(".similarity()", function tests() {
    it("calculates the similarity between two words", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.similarity("political", "theory");
        expect(res).to.be.a("number");
        done();
      });
    });

    it("returns 1.0 for two identical words", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.similarity("political", "political");
        expect(res).to.be.a("number");
        expect(res).to.equal(1.0);
        done();
      });
    });
  });

  describe(".analogy()", function tests() {
    it("given pair, finds the term which stands in analogous relationship to supplied word", function test(done) {
      main.loadModel(file, function (err, model) {
        var res = model.analogy("any", ["and", "or"], 10);
        expect(res).to.be.a("array");
        expect(res).to.have.length(10);
        done();
      });
    });
  });
});

describe("WordVector", function tests() {
  it("can be added to each other", function test(done) {
    main.loadModel(file, function (err, model) {
      var wordVec1 = model.getVector("and");
      var wordVec2 = model.getVector("any");
      var result = wordVec1.add(wordVec2);
      expect(result).to.be.a.instanceOf(main.WordVec);
      done();
    });
  });

  it("can be subtracted from each other", function test(done) {
    main.loadModel(file, function (err, model) {
      var wordVec1 = model.getVector("and");
      var wordVec2 = model.getVector("any");
      var result = wordVec1.subtract(wordVec2);
      expect(result).to.be.a.instanceOf(main.WordVec);
      done();
    });
  });
});
