//
// fusor main observer code
//




offline = true;

//
// reset admin controls
//
var isAdmin = false;
var loginInfo = "<unknown>";


//
// get list of log files
//

function getLogs() {
    if (offline) {
        loadLog('', false);
    } else {
//                    var list = document.getElementById("files");
//                    var listDiv = document.getElementById("filesdiv");
//                    listDiv.style.display = "block";
//                    var filesText = "<a class='hover' onclick='loadServerLog(this)'>[sample log]</a><br>";
//
//                    for (var i = 0; i < files.length; i++) {
//                        filesText += "<a class='hover' onclick='loadServerLog(this)'>";
//                        filesText += files[i];
//                        filesText += "</a><br>";
//                    }
//                    list.innerHTML = filesText;
//                })
//                .catch(error => {
//                    console.log("error: " + error);
//                });
//
//
//    }
        request({url: "/protected/getlogfilenames", method: "GET"})
                .then(raw => {
                    var files = JSON.parse(raw);
                    var list = document.getElementById("files");
                    var listDiv = document.getElementById("filesdiv");
                    listDiv.style.display = "block";
                    window.onkeydown = function (e) {
                        if (e.key === "Escape") {
                            document.getElementById("filesdiv").style.display = "none";
                        }
                    };
                    listDiv.onclick = function (e) {
                        e.stopPropagation();
                    };
                    window.onclick = function (e) {
                        document.getElementById("filesdiv").style.display = "none";
                    };

                    // sort with newest first
                    files.sort((a, b) => {
                        if (a > b)
                            return -1;
                        if (b > a)
                            return 1;
                        return 0;
                    });

                    var filesText = ""; // <a class='hover' onclick='loadServerLog(this)'>[sample log]</a><br>";

                    for (var i = 0; i < files.length; i++) {
                        filesText += "<a class='hover' onclick='loadServerLog(this)'>";
                        filesText += files[i].replace(/%20/g, " ");
                        filesText += "</a><br>";
                    }
                    list.innerHTML = filesText;
                })
                .catch(error => {
                    console.log("error: " + error);
                });
    }
}


function emergency_stop() {
    console.log("emergency stop");
    try {
        request({url: "/protected/emergency_stop", method: "GET"})
                .then(data => {
                    console.log(data);
                })
                .catch(error => {
                    console.log("error: " + error);
                });
    } catch (error) {
        console.log("Error: " + error);
    }
}

function loadServerLog(input) {
    loadLog(input.text, true);
}


function loadLog(fileName, addPrefix) {
    stopStatus();
    /////////////////////////////////////////////////////
    // BEGIN DEAD CODE - I was told not to remove this
    //console.log("loading log: " + fileName);
    //if (fileName === "[sample log]") {
    //    displayLog(fullData, fullData[0]["servertime"]);
    //    return;
    //}
    // END DEAD CODE
    /////////////////////////////////////////////////////


    if (offline) {
        /////////////////////////////////////////////////////
        // BEGIN DEAD CODE - I was told not to remove this
        //url = "/Fusor/logs/"+fileName;
        // END DEAD CODE
        /////////////////////////////////////////////////////
    } else {
        url = "/protected/getlogfile?filename=" + fileName;
    }

    if(offline) {
        // file dialog JavaScript code taken from here
        // https://stackoverflow.com/a/40971885
        var input = document.createElement('input');
        input.type = 'file';

        input.onchange = e => { 
            // get the file reference
            var file = e.target.files[0]; 
            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');

            // here we tell the reader what to do when it's done reading...
            reader.onload = readerEvent => {
                console.log("Loading log: " + file.name);
                var fileContent = readerEvent.target.result;
                var data = JSON.parse(fileContent);
                document.getElementById("logInfo").innerText = file.name;
                displayLog(data["log"], data["base-timestamp"])
            }
        }

        input.click();
        return;
    }
    request({url: url, method: "GET"})
            .then(raw => {
                if (raw.endsWith("},\n")) {
                    raw += "{}]}";
                }
                var data = JSON.parse(raw);

                document.getElementById("logInfo").innerText = fileName.substr(fileName.lastIndexOf("/")+1);

                displayLog(data["log"], data["base-timestamp"]);

            })
            .catch(error => {
                console.log("getlogfile error: " + error);
            });
}



function displayLog(data, timestamp) {
    data.sort(function (a, b) {
        return a["servertime"] - b["servertime"];
    });
    offlineLog = data;
    offline = true;
    updateStatus(data, null, timestamp);
    // document.getElementById("loadLog").innerText = "Live View";
    // document.getElementById("loadLog").onclick = displayLiveData;
    document.getElementById("comment").value = "<offline>";
    document.getElementById("comment").disabled = true;
    document.getElementById("commentbutton").disabled = true;
    document.getElementById("chat").innerText = "<offline>";
    document.getElementById("filesdiv").style.display = "none";
    enableAdminControls(false);
}


function bSearchLog(time) {
    var a = 0;
    var b = offlineLog.length - 1;

    while (b !== a) {
        var c = Math.floor((a + b) / 2);
        var entry = offlineLog[c];
        if (entry["servertime"] >= time) {
            b = Math.floor((a + b) / 2);
        } else {
            a = Math.ceil((a + b) / 2);
        }
    }

    // now go forward through equal values
    while (a < offlineLog.length - 1 && offlineLog[a + 1]["servertime"] === time) {
        a++;
    }

    return a;
}

function findPrior(index, device) {
    if (index === 0) {
        return 0;
    }
    var a = index - 1;
    while (a > index - 50 && offlineLog[a].device !== device) {
        a--;
    }
    return a + 1;
}

function displayLiveData() {
//    initStatus();
//    document.getElementById("loadLog").innerText = "Load Log";
//    document.getElementById("loadLog").onclick = loadLog;
//    document.getElementById("comment").disabled = false;
//    document.getElementById("commentbutton").disabled = false;
//    document.getElementById("comment").focus();
//    enableAdminControls(true);
    location.reload();
}


function enableCameras() {
    request({url: "http://fusor3/numcameras", method: "GET"})
            .then(data => {
                // yes: make the display visible and set the url
                var numCameras = Number(data);       // got number from server
                numCameras = Math.min(numCameras, 4); // 4 cameras max
                for (var i = 1; i <= numCameras; i++) {
                    var cam = document.getElementById("cam" + i);
                    cam.style.display = "inline";
                    //cam.src = window.location.origin + ":45" + (i + 66) + "/mjpg";
                    cam.src = "http://fusor3:45" + (i + 66) + "/mjpg";
                }
            })
            .catch(error => {
                console.log("camera error: " + error);
            });
}

//
// init code
//

createViz();
createText();
