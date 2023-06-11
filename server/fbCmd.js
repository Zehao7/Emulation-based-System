const fs = require('fs')
const path = require("path");
const config = require("./config")
const db = require("firebase/database");
const { update } = require('firebase/database');
const axios = require('axios');

const url = config.firebaseConfig.databaseURL
curr_dir = ""
nameNode = url + "nameNode/"
dataNode = url + "dataNode/"
curr_dir_url = url + curr_dir + ".json"
location = nameNode + "/file_location/.json"
partition = nameNode + "/file_partition/.json"
file_location = {}
file_partition = {}

function setUp(callback) {
    axios.patch(nameNode + ".json", data = '{"default": "null"}')
    axios.patch(dataNode + ".json", data = '{"default": "null"}')

    axios.get(curr_dir_url).then(response => {
        // console.log('orig curr dir:', curr_dir_url)
        curr_dir = curr_dir_url.substring(url.length)
        // console.log('curr dir step 1:', curr_dir)
        curr_dir = curr_dir.substring(0, curr_dir.length-5)
        // console.log("curr dir step 2:", curr_dir)
        curr_dir = curr_dir === '' ? '/' : curr_dir 
        // console.log("curr dir step 3:", curr_dir)

        axios.get(location)
        .then(response => {
            data = response.data
            if (data != null && Object.keys(data).length != 0) {
                file_location = data
                // console.log("location:", file_location, "partition:", partition)
                axios.get(partition).then(response => {
                    file_partition = response.data
                    // console.log("callback 1");
                    callback(file_location, file_partition)
                })
            } else {
            //   console.log("callback 2");
                callback(file_location, file_partition)
            }

        })
    })
        .catch(error => {
            console.log(error);
        });
}

function cd(dir, callback) {
    setUp((file_location, file_partition) => {
        if (dir == ".."){
            console.log("in cd ..: curr_dir:", curr_dir)
            if (curr_dir == "/"){
                callback(curr_dir)
            } else {
                console.log("in cd: curr_dir before split:", curr_dir)
                curr_dir = curr_dir.slice(0, curr_dir.lastIndexOf("/"))
                curr_dir = (curr_dir === '' ? '/' : curr_dir);
                console.log("in cd: curr_dir after split:", curr_dir)
                //patch_file()
                curr_dir_url = url + curr_dir + ".json"
                console.log("in cd ..: final curr_dir:", curr_dir, "final curr_dir_url:", curr_dir_url)
                callback(curr_dir)
            }
        }
        else {
            new_dir = curr_dir === '/' ? "/" + dir : curr_dir + "/" + dir
            console.log("target child dir is:", new_dir)
            console.log("in cd child: name node to visit:", nameNode + new_dir + ".json")
            axios.get(nameNode + new_dir + ".json").then(response => {
                console.log(response.data)
                if (response.data === null){
                    console.log("triggered")
                    callback("directory not found")
                } else {
                    curr_dir = new_dir
                    curr_dir_url = url + curr_dir + ".json"
                    console.log("curr_dir after cd:", curr_dir)
                    //patch_file()
                    callback(curr_dir)
                }
            })

        } 
    });
}

function mkdir(dir, callback) {
    setUp((file_location, file_partition, curr_dir) => {
        // assume dir start with /
        res = dir.slice(1).split('/')
        n = res.length
        parentDir = dir.slice(1, dir.lastIndexOf('/') + 1)
        axios.get(nameNode + parentDir + "/.json")
            .then(response => {
                data = response.data
                if (data === null) {
                    callback("parent directory not found")
                } else {
                    new_dir = nameNode + dir.slice(1) + "/.json"
                    axios.get(new_dir).then(response => {
                        if (response.data !== null) {
                            callback("new directory already exists")
                        } else {
                            axios.put(new_dir, '{"default": "null"}')
                            callback("success")
                        }
                    })
                }
            })
    });
}

function ls(file, callback) {
    //console.log("ls here")
    setUp((file_location, file_partition) => {
        // Assume file starts with "/"
        directory = file === '/' ? nameNode + '.json' : nameNode + file + ".json"
        console.log("in ls: name node to visit:", directory)
        ans = ""
        axios.get(directory)
            .then(response => {
                data = response.data
                if (data === null) {
                    callback("in ls: directory not found")
                } else {
                    for (key in data) {
                        if (key !== "default") {
                            ans = ans + key + " "
                        }
                    }
                    callback(ans)
                }
            })
    })
}

function cat(path, callback) {

    setUp((file_location, file_partition) => {

        // Assums path starts with /
        console.log('cat:', path)

        path = path.split(".")[0]
        temp = path.split("/")
        file = temp[temp.length - 1]
        fileName = file.split(".")[0]

        if (!(fileName in file_location)) {
            callback("file not found")
            return
        }
        file_loc = file_location[fileName]
        k_partition = file_partition[fileName]
        var res = []
        let promises = []
        for (let i = 0; i < k_partition; i++) {
            promises.push(
                axios.get(dataNode + file_loc + "/" + fileName + (i + 1) + ".json").then((response) => {
                    res.push.apply(res, response.data)
                }))

        }

        Promise.all(promises).then(() => {
            // console.log(res)
            callback(res)
        })
    })
}

function rm(path, callback) {
    setUp((file_location, file_partition) => {

        // Assume path starts with /, ends with .json
        res = path.slice(1).split('/')

        fileName = res[res.length - 1].split(".")[0]
        if (!(fileName in file_location)) {
            callback("file not exist")
        }
        file_loc = file_location[fileName]

        parentDir = path.slice(1, path.lastIndexOf('/') + 1)
        axios.get(nameNode + parentDir + "/.json")
            .then(response => {
                data = response.data
                if (data === null) {
                    callback("parent directory not found")
                }
            })

        rm_nameNode_dir = nameNode + path
        rm_dataNode_dir = dataNode + file_loc + ".json"

        axios.put(rm_nameNode_dir, '{}')
        axios.put(rm_dataNode_dir, '{}')
        delete file_location[fileName]
        delete file_partition[fileName]
        patch_file();
        callback("Successfully removed.")
    })

}

function put(file, filename, numParts, callback) {
    setUp((file_location, file_partition) => {
        // Assume file is in *.json, dir starts with /
        fileName = filename.split(".")[0]
        if (fileName in file_location) {
            console.log("file already exist, please remove first")
            callback("file already exist, please remove first")
        }
        else {
          dir = curr_dir
          numParts = parseInt(numParts)
          var json = file
          var pnos = new Array(numParts)

          for (let i = 0; i < numParts; i++) {
              pnos[i] = json.slice(Math.floor(json.length * i / numParts), Math.floor(json.length * (i + 1) / numParts));
          }

          //put into name node
          console.log("11111111" + dir)
          console.log("22222222"+ JSON.stringify(json))
          console.log("333333333"+ filename)
          console.log(numParts)
          var res = dir.slice(1).split('/')
          var put_dir = nameNode + dir + "/.json"
          var put_key = res.join("_") + "_" + fileName
          var put_val = {}
          put_val[fileName] = put_key
          axios.patch(put_dir, put_val)

          //put into data node
          for (let i = 1; i < numParts + 1; i++) {
              put_dir = dataNode + put_key + "/" + fileName + i + "/.json"
              console.log("put_dir: "+put_dir)
              axios.put(put_dir, pnos[i - 1])
          }

          file_location[fileName] = put_key
          file_partition[fileName] = numParts
          patch_file();
          callback("Success!")
        }
    })
}

function getPartitionLocations(file, callback) {
    setUp((file_location, file_partition) => {
        fileName = file.split(".")[0]
        if (fileName in file_location) {
            callback(file_location[fileName])
        } else {
            callback("file not found")
        }
    })
}

//note: numParts is in string format
function readPartition(file, numParts, callback) {
    setUp((file_location, file_partition) => {

        fileName = file.split(".")[0]
        partitionNum = parseInt(numParts)
        var file_loc
        if (fileName in file_location) {
            file_loc = file_location[fileName]
            if (partitionNum > parseInt(file_partition[fileName]) || partitionNum === 0) {
                callback("Partition not found.")
            } else {
                file_path = dataNode + file_loc + "/" + fileName + partitionNum + "/.json"
                axios.get(file_path).then((response) => {
                    callback(response.data)
                })
            }
        } else {
            callback("file not found")
        }
    })
}

function patch_file() {
    axios.put(location, file_location)
    axios.put(partition, file_partition)
}

function doQuery(query, callback) {
    console.log("---------------------------------------")
    // console.log(query)
    var json = JSON.parse(query)
    var select = json.select;
    var from = json.from.toLowerCase()
    var where = json.where
    var groupby = json.groupby
    console.log(where)

    // retrieve number of partitions
    // assume from file always exists
    filename = from + ".json"
    // filename = "student.json"
    console.log(nameNode + "/file_partition/" + from + "/.json")
    axios.get(nameNode + "/file_partition/" + from + "/.json").then((response) => {
    // axios.get('https://dsci551-project-229fc-default-rtdb.firebaseio.com/nameNode//file_partition/student/.json').then((response) => {
        numPartitions = response.data
        promises = []
        partResult = {}
        partResult["input"] = query
        console.log("****************************************")
        for (let i = 1; i < numPartitions + 1; i++) {
            promises.push(new Promise((resolve, reject) => {
                readPartition(filename, i, (data) => {
                    partResultGroupBy = {}
                    partResultSelect = []
                    for (const d of data) {
                        // filter the where clause
                        var flag = true
                        if (where != null) {
                            // console.log(d)
                            for (let con of where) {
                                // console.log("##################################")
                                // console.log(d)
                                // console.log("##################################")
                                // console.log(con)
                                if (!compare(d, con)) {
                                    flag = false
                                }
                            }
                            // console.log(flag)
                        }
                        if (flag) {
                            // handle group by
                            if (groupby != null) {
                                group = d[groupby]
                                if (group in partResultGroupBy) {
                                    partResultGroupBy[group] = partResultGroupBy[group] + 1
                                } else {
                                    partResultGroupBy[group] = 1
                                }
                            }
                            // handle select
                            else {
                                partResultSelect.push(render(d, select))
                            }
                        }
                    }
                    
                    if (groupby != null) {
                        partResult["Partition" + i] = partResultGroupBy
                    }else{
                        partResult["Partition" + i] = partResultSelect
                    }
                    resolve("Success");
                })
            }))
        }

        Promise.all(promises).then((unused) => {
            // Reduce
            res = ""
            if (groupby != null) {
                allResult = {}
                for (pr in partResult) {
                    for (group in partResult[pr]) {
                        if (group in allResult) {
                            allResult[group] = allResult[group] + pr[group]
                        } else {
                            allResult[group] = pr[group]
                        }
                    }
                }
                partResult["All"] = allResult
                callback([partResult, null])
            } else {
                allResult = []
                for (pr in partResult) {
                    allResult.push.apply(allResult, partResult[pr])
                }
                partResult["All"] = allResult
                callback([partResult, null])
            }
        })
    })
}

function render(obj, select) {
    var res = ""
    for (let str of select) {
        res = res + obj[str] + "  "
    }
    return res
}

function compare(obj, con) {
    v1 = obj[con.attr]
    condition = con.method
    v2 = con.value
    switch(con.attr){
        case "Name":
            if (v2 == ""){
                return true
            }
        case "SpecName":
            if (v2 == null){
                return true
            }
        case "Hired":
            if (!("value" in con)){
                return true
            }
        case "CompName":
            if (v2 == ""){
                return true
            }
        case "Role":
            if (v2 == ""){
                return true
            }
        case "Company":
            if (v2 == ""){
                return true
            }
        case "Industry":
            if (v2 == ""){
                return true
            }
        
        
    } 
    if (condition == '=') {
        return v1 == v2
    }
    else if (condition == '<') {
        return v1 < v2
    }
    else if (condition == '>') {
        return v1 > v2
    }
    else if (condition == '>=') {
        return v1 >= v2
    }
    else if (condition == '<=') {
        return v1 <= v2
    }
}

exports.mkdir = mkdir
exports.cd = cd
exports.ls = ls
exports.cat = cat
exports.rm = rm
exports.put = put
exports.getPartitionLocations = getPartitionLocations
exports.readPartition = readPartition
exports.doQuery = doQuery