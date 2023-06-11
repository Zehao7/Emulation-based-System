import React from 'react';
import Axios from 'axios'
import Explorer from './explorer';
import Query from './query';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

function App() {
  var cmd = '', params = [], filename = '', count=0

  const [myOutput, setMyOutput] = React.useState({
    cmdErr: '', queryErr: '', curDir: '/', cmdOutput: '', queryOutput: ''
  })

  const [myInput, setMyInput] = React.useState({
    cmdStr: '', query:''
  })

  const [srcDB, setSrcDB] = React.useState('')

  const [srcDBFlip, setSrcDBFlip] = React.useState(false)

  const [firstMount, setFirstMount] = React.useState(1);

  React.useEffect(() => {
    if(firstMount > 0) {
      //console.log("App firstMount:", firstMount)
      setFirstMount(firstMount-1);
    }
    else {
      Axios.post('http://localhost:3001/db', {db: srcDB}).then((res) => {
        count++;
        console.log("in db:", res.data, " App count:", count);
        setSrcDBFlip(!srcDBFlip)
      });
    }
  }, [srcDB]);

  function handleChange(event) {
    setMyInput(prevInput => {
      return {
        ...prevInput,
        [event.target.name]: event.target.value
      }
    })
  }

  function handleCmd(event) {
    event.preventDefault();
    [cmd, params, filename] = parseRawCmd(myInput.cmdStr);
    console.log('after parse:', 'cmd:', cmd, 'params', params, 'filename', filename);
    Axios.post('http://localhost:3001/cmd', {cmd: cmd, params: params, filename: filename}).then((res) => {
      console.log(res.data)
      setMyOutput(prevOutput => {
        return {
          ...prevOutput,
          cmdErr: res.data.err
        }
      })
      if(cmd === 'cd') {
        setMyOutput(prevOutput => {
          return {
            ...prevOutput,
            curDir: res.data.content
          }
        })
      }
      else {
        setMyOutput(prevOutput => {
          return {
            ...prevOutput,
            cmdOutput: res.data.content
          }
        })
      }
    });
    setMyInput({
      cmdStr: '', query:''
    });
  }

  function handleQuery(event) {
    event.preventDefault();
    Axios.post('http://localhost:3001/query', {rawQuery: myInput.query}).then((res) => {
      console.log(res.data);
      setMyOutput(prevOutput => {
        return {
          ...prevOutput,
          queryOutput: res.data.output,
          queryErr: res.data.err
        }
      })
    })
    setMyInput({
      cmdStr: '', query:''
    })
  }

  function handleDB(event) {
    setSrcDB(event.target.value);
  }

  function parseRawCmd(cmdLine) {
    var cmd, params, filename, words;
    words = cmdLine.split(' ');
    cmd = words[0]
    switch(cmd) {
      case 'put':
        filename = words[1]
        params = [words[2], words[3]];
        break;
      default:
        params = [words[1]];
        break;
    }
    return [cmd, params, filename]
  }

  function handleSQLTest() {
    Axios.post('http://localhost:3001/sqltest', {name: "ZhangSan", age: 18, country: "USA"}).then((res) => {
      console.log(res.data);
    })
  }

  return (
    <div>
      <h1>CS Department Job Hunter Tracking System</h1>
      <br/>
      <h4>Group members: Haorui Chen, Zihao Zhang, Zehao Li</h4>
      <br/><br/><br/>
      <label>Current DB:</label>
      <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <input type="radio" id="Firebase" value="Firebase" name="srcDB" checked={srcDB === 'Firebase'} onChange={handleDB}/>
      <label htmlFor="Firebase">Firebase</label>
      <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <input type="radio" id="MySQL" value="MySQL" name="srcDB" checked={srcDB === 'MySQL'} onChange={handleDB}/>
      <label htmlFor="MySQL">MySQL</label>
      <br/><br/>
      <h2>File System Navigator:</h2>
      <Explorer srcDB={srcDB} srcDBFlip={srcDBFlip}/>
      <br/><br/>
      <h2>Search {'&'} Analysis</h2>
      <Query srcDB={srcDB}/>
      {/* <br/><br/>
      <label>Current dir:{myOutput.curDir}</label>
      <form onSubmit={handleCmd}>
        <label>cmd:     </label>
        <input 
          type="text"
          placeholder="cmd"
          onChange={handleChange}
          name="cmdStr"
          value={myInput.cmdStr}
        />
        <button>Submit</button>
        <br/>
        <label>err:{myOutput.cmdErr}</label>
        <br/>
        <label>outPut:{myOutput.cmdOutput}</label>
      </form>
      <br/>

      <form onSubmit={handleQuery}>
        <label>query:     </label>
        <input 
          type="text"
          placeholder="query"
          onChange={handleChange}
          name="query"
          value={myInput.query}
        />
        <button>Submit</button>
        <br/>
        <label>err:{myOutput.queryErr}</label>
        <br/>
        <label>outPut:{myOutput.queryOutput}</label>
      </form>
      <br/>
      <button onClick={handleSQLTest}>SQLTest</button> */}

      

      
    </div>
  );
}

export default App;
