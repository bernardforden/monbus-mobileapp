'use strict';
class GeoInfo {
  constructor(opts) {
    opts = opts || {};
  }
  from(lat1, lon1, lat2, lon2) {
    Number.prototype.toRadians = function(){
      var pi = Math.PI;
      return this * (pi/180);
    }
    Number.prototype.toDegrees = function() {
      return this * 180 / Math.PI;
    };
    var R = 6371000;
    var φ1 = lat1.toRadians();
    var φ2 = lat2.toRadians();
    var Δφ = (lat2-lat1).toRadians();
    var Δλ = (lon2-lon1).toRadians();
    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    var y = Math.sin(lon2-lon1) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
            Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
    var brng = Math.atan2(y, x).toDegrees();
    return { d, brng };
  }
}

module.exports = GeoInfo;
