var fs = require('fs');
var object = require('object-manipulation');

class Info{
  constructor(){
    this._cache = {
      activeUsers: 0,
      sessions: 0,
    };
    this.timeLine = {
      activeUsers: [],
      sessions: [],
      pathFrom: []
    };
    this.pathFrom = {};

    var data = {};
    if (fs.existsSync("data/Analytics-data.json")){
      data = fs.readFileSync("data/Analytics-data.json", "utf-8");
    }
    this.timeLine = object.merg(this.timeLine, data.timeLine);
    this.pathFrom = object.merg(this.pathFrom, data.pathFrom);
  }

  get activeUsers(){
    var num = 0;
    var time = Math.floor(Date.now()/1000);

    for (let session in module.exports.sessions.ids){
      if (time - (module.exports.sessions.ids[session].lastActive/1000) < 120){
        num += 1;
      }
    }
    return num;
  }

  get sessions(){
    return module.exports.sessions.count;
  }
}

var info = new Info();

function OnActivity(req, res){
  var prevURL = req.session.data.preURL || "entry";
  req.session.data.preURL = req.url;

  if (!object.isObject(info.pathFrom[prevURL])){
    info.pathFrom[prevURL] = {};
  }

  if (typeof(info.pathFrom[prevURL][req.url]) != "number"){
    info.pathFrom[prevURL][req.url] = 1;
  }else{
    info.pathFrom[prevURL][req.url] += 1;
  }

  info.timeLine.pathFrom.push({time: Date.now(), value: prevURL+' to '+req.url});

  info.newPath = true;
}

setInterval(function () {
  //Get data
  var newData = false;
  var activeUsers = info.activeUsers;
  var sessions = info.sessions;

  //Test if new data
  //True = add new data to timeline
  if (typeof(info.timeLine.sessions[info.timeLine.sessions.length-1]) != "object" || sessions != info.timeLine.sessions[info.timeLine.sessions.length-1].value){
    newData = true;
    info.timeLine.sessions.push({time: Date.now(), value: sessions});
  }
  if (typeof(info.timeLine.activeUsers[info.timeLine.activeUsers.length-1]) != "object" || activeUsers != info.timeLine.activeUsers[info.timeLine.activeUsers.length-1].value){
    newData = true;
    info.timeLine.activeUsers.push({time: Date.now(), value: activeUsers});
  }
  if (info.newPath){
    info.newPath = false;
    newData = true;
  }

  //If there is new data then save the data
  if (newData){
    module.exports.save();
  }
}, 1000);

module.exports = {
  sessions: null,
  activity: OnActivity,
  info: info,
  dataSaver: true,
  save: function(){
    if (!fs.existsSync("data")){
      fs.mkdirSync("data");
    }

    var data = {
      timeLine: info.timeLine,
      pathFrom: info.pathFrom
    };

    if (module.exports.dataSaver){
      fs.writeFileSync("data/Analytics-data.json", JSON.stringify(data));
    }else{
      fs.writeFileSync("data/Analytics-data.json", JSON.stringify(data, null, 2));
    }
  }
};
