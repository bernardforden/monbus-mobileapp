const Geo = require('./monbus/lib/geo-nearby')
const dataSet = require('./monbus/database/geohash.json')
const stopArea = require('./monbus/database/stoparea.json')
const geo = new Geo(dataSet, { sorted: true, limit: 10 });
var nodes = geo.nearBy(48.87, 2.2, 300);
nodes.forEach(element => {
  console.log(element.i, stopArea[element.i])
});