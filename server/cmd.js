const fs = require('fs')
const path = require("path");
const config = require("./config")
const {NULL} = require("mysql/lib/protocol/constants/types");
// for funtions below, the uniform return format is [content (see each func for detailed explanation), error (need to convert to string format)]

function mkdir(ino, dir, callback) {
    var content = 'whatever', err = ''
    console.log('ino:', ino, ' dir:', dir)
    // content: anything you may want to tell the user
    config.sqlDB.query("SELECT * FROM meta WHERE PARENT = "+ino+" AND FILENAME ='"+dir+"'", function(err, result){
        console.log('result:',result)
        if(err) {
          console.log(err)
          throw err
        } else {
            //console.log(result[0].filename)
            if(result.length>0){
                callback("fail")
            }
            else{
                var now = new Date()
                var sql = "INSERT INTO META VALUES (?,?,?,?,?)"
                var fill = [Math.floor((Math.random()*10000) + 1), dir, now.toString(), ino,'d']
                config.sqlDB.query(sql, fill, function (err, result) {
                    callback("success")
                })
            }
        }

    });

}

function findIno(dir, callback) {
    var path = dir.split('/').slice(1)
    getTree(function (result){
        var ino = 0
        let res = ""
        var temp = result
        for(let i=0;i<path.length;i++){
            var found = false
            for(let j=0;j<temp.list.length;j++){
                //console.log("compare:"+temp.list[j].name+" "+path[i])
                if(temp.list[j].name===path[i]){
                    found = true
                    ino = temp.list[j].key
                    temp = temp.list[j]

                    res = res + "/" + path[i];
                    //console.log("found one:"+res)
                    break;
                }
            }
            if(!found){
                return callback("error",0)
            }
        }

        return callback(res,ino)
    })
}

function cd(dir,callback) {
    var content = '', err = ''
    //console.log('cd:', dir)
    var path = dir.split('/').slice(1)
    //console.log("path:"+path)
    // content: current working directory

    getTree(function (result){
        var ino = 0
        let res = ""
        var temp = result
        for(let i=0;i<path.length;i++){
            var found = false
            for(let j=0;j<temp.list.length;j++){
                //console.log("compare:"+temp.list[j].name+" "+path[i])
                if(temp.list[j].name===path[i]){
                    found = true
                    ino = temp.list[j].key
                    temp = temp.list[j]

                    res = res + "/" + path[i];
                    //console.log("found one:"+res)
                    break;
                }
            }
            if(!found){
                return callback("error",0)
            }
        }

        return callback(res,ino)
    })
    return [content, err];
}
class Entity{
    constructor(key,name,list,typ) {
        this.key = key
        this.name = name
        this.list = []
        this.typ = typ
    }
}
function getTree(callback){
    config.sqlDB.query("SELECT * FROM meta", function(err, result){

        if(err) {
            throw err
        } else {
            //console.log(result[0].filename)
            var l = result;

            var e = new Entity(0,"home",undefined, "d");
            dfs(e, e.key, l);
        }
        return callback(e)
    });
}

function dfs(e, cur, l){
    //console.log(e)
    for(let i=0;i<l.length;i++){
        //console.log(l[i].parent+" "+cur)
        if(l[i].parent==cur){
            e.list.push(new Entity(l[i].inumber, l[i].filename, undefined, l[i].typ))
        }
    }
    for(let i=0;i<e.list.length;i++){
        dfs(e.list[i],e.list[i].key,l);
    }
}

function ls(file, callback) {

    var content = '', erro = '';
    console.log('ls:', file)
    // content: list of dirs & files in string format

    config.sqlDB.query("SELECT * FROM meta WHERE PARENT = "+file, function(err, result){
        var res = ""
        if(err) {

            erro = err

        } else {
            for(let i=0;i<result.length;i++){
                res = res + result[i].filename + " "
            }
        }
        return callback(res)
    });

}

// function cat(temp,callback) {
//     doQuery("{\"select\":[\"Industry\",\"Count\"],\"from\":\"Company\",\"where\":[],\"groupby\":\"Industry\"}",(attr)=>{callback(attr)})
// }

function cat(file,callback) {
    var content = '', err = ''
    console.log('cat:', file)
    // content: file content
    findIno(file, function (path, ino) {
        var arr = []

        config.sqlDB.query("SELECT typ FROM meta WHERE inumber = "+ino,(err,res)=>{
            if(err){
                console.log(err)
            }
            if(res[0].typ=='d'){
                return callback("Invalid type or file name")
            }
            console.log(res[0])
            if(res[0].typ=='fs'){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino, function (err, res) {
                    for(let i=0;i<res.length;i++){
                        arr.push(res[i].partno)
                    }
                    var result = "[\n"
                    for(let i=0;i<arr.length;i++){
                        config.sqlDB.query("SELECT * FROM t"+arr[i], function (err, res) {
                            for(let j=0;j<res.length;j++){
                                result = result + "    {\n"
                                result = result + "        \"ID\":\"" +res[j].ID
                                result = result +"\",\n        \"Name\":\"" +res[j].Name
                                result = result +"\",\n        \"SpecName\":\"" +res[j].SpecName
                                result = result +"\",\n        \"Hired\":\"" +(res[j].Hired=="1"?"true":"false")
                                result = result +"\",\n        \"CompName\":\"" +res[j].CompName
                                result = result +"\",\n        \"Role\":\"" +res[j].Role+"\"\n"

                                if(i==arr.length-1&&j==res.length-1){
                                    result = result + "    }\n"
                                    result = result + "]"
                                    console.log(result)
                                    callback(result)
                                }
                                else{
                                    result = result+ "    },\n"
                                }
                            }
                        })
                    }
                })
            }
            else if(res[0].typ=='fc'){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino, function (err, res) {
                    for(let i=0;i<res.length;i++){
                        arr.push(res[i].partno)
                    }
                    var result = "[\n"
                    for(let i=0;i<arr.length;i++){
                        config.sqlDB.query("SELECT * FROM t"+arr[i], function (err, res) {
                            for(let j=0;j<res.length;j++){
                                result = result + "    {\n"
                                result = result + "        \"Company\":\"" +res[j].Company
                                result = result +"\",\n        \"Industry\":\"" +res[j].Industry+"\"\n"

                                if(i==arr.length-1&&j==res.length-1){
                                    result = result + "    }\n"
                                    result = result + "]"
                                    console.log(result)
                                    callback(result)
                                }
                                else{
                                    result = result+ "    },\n"
                                }
                            }
                        })
                    }
                })
            }
            else if(res[0].typ == "fp"){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino, function (err, res) {
                    for(let i=0;i<res.length;i++){
                        arr.push(res[i].partno)
                    }
                    var result = "[\n"
                    for(let i=0;i<arr.length;i++){
                        config.sqlDB.query("SELECT * FROM t"+arr[i], function (err, res) {
                            for(let j=0;j<res.length;j++){
                                result = result + "    {\n"
                                result = result + "        \"Name\":\"" +res[j].Name
                                result = result +"\",\n        \"Size\":\"" +res[j].Size+"\"\n"

                                if(i==arr.length-1&&j==res.length-1){
                                    result = result + "    }\n"
                                    result = result + "]"
                                    console.log(result)
                                    callback(result)
                                }
                                else{
                                    result = result+ "    },\n"
                                }
                            }
                        })
                    }
                })
            }
        })


    })
    return [content, err];
}

function deleteFile(ino) {
    config.sqlDB.query("SELECT * FROM PARTS WHERE INUMBER = "+ino, function (err, res) {
        if(err) console.log(err)
        var arr = []
        for(let i=0;i<res.length;i++){
            arr.push(res[i].partno)
        }
        for(let i=0;i<arr.length;i++){
            config.sqlDB.query("DROP TABLE t"+arr[i], function (err, res) {
                if(err) console.log(err)
                if(i==arr.length-1){
                    config.sqlDB.query("DELETE FROM PARTS WHERE INUMBER = "+ino, function (err, res) {
                        config.sqlDB.query("DELETE FROM META WHERE INUMBER = "+ino, function (err, res) {

                        })
                    })
                }
            })
        }
    })
}

function dfs1(nodelist, reslist, typlist, cur) {
    for(let i=0;i<nodelist.length;i++){
        if(nodelist[i].inumber==cur){
            reslist.push(cur)
            typlist.push(nodelist[i].typ)
        }
    }
    var temp = []
    for(let i=0;i<nodelist.length;i++){
        //console.log(l[i].parent+" "+cur)
        if(nodelist[i].parent==cur){
            temp.push(nodelist[i].inumber)
        }
    }
    for(let i=0;i<temp.length;i++){
        dfs1(nodelist, reslist, typlist, temp[i]);
    }
}

function rm(file, callback) {
    var content = 'whatever', err = ''
    console.log('rm:', file)
    findIno(file, function (path, ino) {
        config.sqlDB.query("SELECT * FROM META", function (err, res) {
            if(err) console.log(err)
            var reslist = []
            var typlist = []
            if(ino==0){
                return callback("0")
            }
            dfs1(res, reslist, typlist, ino)

            var str = "("+reslist.join(",")+")"
            console.log(str)
            for(let i=0;i<reslist.length;i++){
                if(typlist[i]=='f'){
                    deleteFile(reslist[i])
                }
            }
            config.sqlDB.query("DELETE FROM META WHERE INUMBER IN "+str, function (err, res) {
                if(err) console.log(err)
                else{
                    callback("1")
                }
            })
        })
    })

    return [content, err];
}

function put(file, dir, numParts,filename, callback) {
    var content = 'whatever', err = ''
    //console.log('put:', file, dir, numParts)


    var type = ''
    try {

        var json = file
        findIno(dir, function (path, ino) {
            var pnos = new Array(numParts)
            if('ID' in json[0]){
                type = 'fs'
                for(let i=0;i<numParts;i++){
                    pnos[i] = Math.floor(Math.random()*10000 + 1)
                    let sq = "CREATE TABLE t"+pnos[i]+"( ID varchar(50), Name varchar(50), SpecName varchar(80), Hired int, CompName varchar(40), Role varchar(40), pno varchar(10))"
                    config.sqlDB.query(sq, (err, res)=>{
                        if(err){
                            console.log(err);
                        }
                        if(i==numParts-1){
                            for(let j=0;j<json.length;j++){
                                var index = 0
                                var table = ""
                                console.log(json[j].ID)
                                var hash = parseInt(json[j].ID.substring(6,10))
                                index = hash%numParts
                                table = pnos[index]
                                console.log(pnos)
                                let sql = "INSERT INTO t"+table+" VALUES (?,?,?,?,?,?,?)"
                                let fill = [json[j].ID, json[j].Name, json[j].SpecName,json[j].Hired?1:0,json[j].CompName,json[j].Role, pnos[index]]
                                config.sqlDB.query(sql, fill, (err,res)=>{
                                    if(err){
                                        console.log(err)
                                    }
                                })
                            }
                        }
                    })
                }
            }
            else if('Company' in json[0]){
                type = "fc"
                for(let i=0;i<numParts;i++){
                    pnos[i] = Math.floor(Math.random()*10000 + 1)
                    let sq = "CREATE TABLE t"+pnos[i]+"( Company varchar(50), Industry varchar(50), pno varchar(10))"
                    config.sqlDB.query(sq, (err, res)=>{
                        if(err){
                            console.log(err);
                        }
                        if(i==numParts-1){
                            for(let j=0;j<json.length;j++){
                                var index = 0
                                var table = ""
                                var hash = 0
                                for(let k=0;k<json[j].Company.length;k++){
                                    hash += json[j].Company.charCodeAt(k)
                                }
                                index = hash%numParts
                                table = pnos[index]
                                console.log(pnos)
                                let sql = "INSERT INTO t"+table+" VALUES (?,?,?)"
                                let fill = [json[j].Company, json[j].Industry, pnos[index]]
                                config.sqlDB.query(sql, fill, (err,res)=>{
                                    if(err){
                                        console.log(err)
                                    }
                                })
                            }
                        }
                    })
                }
            }
            else if("Name" in json[0]){
                type = "fp"
                for(let i=0;i<numParts;i++){
                    pnos[i] = Math.floor(Math.random()*10000 + 1)
                    let sq = "CREATE TABLE t"+pnos[i]+"( Name varchar(50), Size INT, pno varchar(10))"
                    config.sqlDB.query(sq, (err, res)=>{
                        if(err){
                            console.log(err);
                        }
                        if(i==numParts-1){
                            for(let j=0;j<json.length;j++){
                                var index = 0
                                var table = ""
                                var hash = 0
                                for(let k=0;k<json[j].Name.length;k++){
                                    hash += json[j].Name.charCodeAt(k)
                                }
                                index = hash%numParts
                                table = pnos[index]
                                console.log(pnos)
                                let sql = "INSERT INTO t"+table+" VALUES (?,?,?)"
                                let fill = [json[j].Name, json[j].Size, pnos[index]]
                                config.sqlDB.query(sql, fill, (err,res)=>{
                                    if(err){
                                        console.log(err)
                                    }
                                })
                            }
                        }
                    })
                }
            }

            var now = new Date()
            var sql = "INSERT INTO META VALUES (?,?,?,?,?)"
            var newFileNo = Math.floor((Math.random()*10000) + 1)
            var fill = [newFileNo, filename, now.toString(), ino, type]
            config.sqlDB.query(sql, fill, function (err, result) {
                for(let i=0;i<numParts;i++){
                    if(pnos[i]!=0){
                        let sqll = "INSERT INTO parts VALUES (?,?,?)"
                        let filll = [newFileNo, pnos[i], pnos[i]]
                        config.sqlDB.query(sqll, filll, (err,res)=>{
                            if(err){
                                console.log(err)
                            }
                        })
                    }
                }
                callback("success")
            })
        })
        //console.log("File content:", data);
        //use data


        return [content, '']
    } catch (err) {
        console.log(err)
        return ['', err.toString()]
    }
}


function getPartitionLocations(file, callback) {
    var content = '', err = ''
    console.log('getPartitionLocations:', file)
    findIno(file,function (path, ino) {

        if(path==="error"){
            return callback("error")
        }
        console.log(path + " " + ino)
        config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino, function (err, res) {
            var ret = ""
            if(err) console.log(err)
            else console.log(res)
            for(let i=0;i<res.length;i++){
                ret = ret + res[i].partno + " "
            }
            callback(ret)
        })

    })
    // content: list of partitions, in string format
    return [content, err];
}

//note: numParts is in string format
function readPartition(file, numParts, callback) {
    var content = '', err = ''
    console.log('readPartition:', file, numParts)
    // content: file content at partition numParts
    findIno(file,function (path, ino) {

        if(path==="error"){
            return callback("error")
        }
        console.log(path + " " + ino)
        config.sqlDB.query("SELECT typ FROM meta WHERE inumber = "+ino,(err,res)=>{
            if(err){
                console.log(err)
            }
            if(res.length==0){
                return callback("No results found.")
            }
            console.log(res[0])
            if(res[0].typ=='fs'){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino+" AND tableno = "+numParts, function (err, res) {
                    if(err) console.log(err)
                    config.sqlDB.query("SELECT * FROM t"+numParts, function (err, res) {
                        var ret = ""
                        console.log(res.length)
                        for(let i=0;i<res.length;i++){
                            ret = ret + res[i].ID +"\t"+res[i].Name+"\t"+res[i].SpecName+"\t"+res[i].Hired+"\t"+res[i].CompName+"\t"+res[i].Role+"\n"
                        }
                        callback(ret)
                    })
                })
            }
            else if(res[0].typ=='fc'){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino+" AND tableno = "+numParts, function (err, res) {
                    if(err) console.log(err)
                    config.sqlDB.query("SELECT * FROM t"+numParts, function (err, res) {
                        var ret = ""
                        console.log(res.length)
                        for(let i=0;i<res.length;i++){
                            ret = ret + res[i].Company +"\t"+res[i].Industry+"\n"
                        }
                        callback(ret)
                    })
                })
            }
            else if(res[0].typ == 'fp'){
                config.sqlDB.query("SELECT * FROM parts WHERE inumber = "+ino+" AND tableno = "+numParts, function (err, res) {
                    if(err) console.log(err)
                    config.sqlDB.query("SELECT * FROM t"+numParts, function (err, res) {
                        var ret = ""
                        console.log(res.length)
                        for(let i=0;i<res.length;i++){
                            ret = ret + res[i].Name +"\t"+res[i].Size+"\n"
                        }
                        callback(ret)
                    })
                })
            }
        })

    })
}



exports.mkdir = mkdir
exports.cd = cd
exports.ls = ls
exports.cat = cat
exports.rm = rm
exports.put = put
exports.getPartitionLocations = getPartitionLocations
exports.readPartition = readPartition