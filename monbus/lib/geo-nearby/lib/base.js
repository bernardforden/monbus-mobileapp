'use strict';

const geohash = require('ngeohash');
const helpers = require('./helpers');

const uniq = helpers.uniq;
const rangeIndex = helpers.rangeIndex;
const rangeIndexLength = rangeIndex.length;
const binarySearch = helpers.binarySearch;

function rangeDepth(radius) {
  for (let i = 0; i < rangeIndexLength - 1; i++) {
    if (radius - rangeIndex[i] < rangeIndex[i + 1] - radius) {
      return 52 - (i * 2);
    }
  }

  return 2;
}

function buildBoxSet(hash, radiusBitDepth) {
  const neighbors = geohash.neighbors_int(hash, radiusBitDepth);

  neighbors.push(hash);
  neighbors.sort();

  return uniq(neighbors);
}

function leftShift(hash, bit) {
  return hash * Math.pow(2, bit);
}

function rangeSet(lat, lon, radiusBitDepth, bitDepth) {
  const hash = geohash.encode_int(lat, lon, radiusBitDepth);
  const neighbors = buildBoxSet(hash, radiusBitDepth);
  const bitDiff = bitDepth - radiusBitDepth;
  const ranges = [];
  let lowerRange = 0;
  let upperRange = 0;

  for (let i = 0; i < neighbors.length; i++) {
    lowerRange = neighbors[i];
    upperRange = lowerRange + 1;
    while (neighbors[i + 1] === upperRange) {
      neighbors.shift();
      upperRange = neighbors[i] + 1;
    }
    ranges.push({ lower: leftShift(lowerRange, bitDiff), upper: leftShift(upperRange, bitDiff) });
  }

  return ranges;
}

function searchBetween(set, min, max, limit) {
  const data = set.data;
  const result = [];
  const length = Object.keys(data).length;
  if (set._sorted) {
    const _min = binarySearch(set, min, 0, length - 1);
    const _max = binarySearch(set, max, 0, length - 1, true);
    for (let i = _min; i <= _max; i++) {
      if (limit && result.length >= limit) {
        return result;
      }
      result.push(data[i]);
    }
    return result;
  }
  return [];
}

function queryByRanges(data, ranges, limit) {
  let replies = [];
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const replie = searchBetween(data, range.lower, range.upper, limit);
    if (replie.length) {
      replies = replies.concat(replie);
    }
    if (limit && replies.length >= limit) {
      return replies;
    }
  }

  return replies;
}

module.exports.nearBy = (data, opts) =>
  queryByRanges(data, rangeSet(opts.lat, opts.lon, rangeDepth(opts.radius), 52), opts.limit);
