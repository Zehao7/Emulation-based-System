import React from 'react';
import Axios from 'axios';
import Container from './container.js';
import { MkdirForm, FilePartitionFrom } from './form.js';

export default function Explorer(props) {
  let fileReader, numPart, fileName, count=0;

  const [explorerState, setExplorerState] = React.useState({
      cmdErr: '', curDir: '/', cmdOutput: '', eList: '', fileContent: []
  })

  const [cmdInput, setCmdInput] = React.useState({
    cdChildDir: '', catFile:'', rmTarget:''
  })

  const [cntnrVsblty, setCntnrVsblty] = React.useState({
    mkdirVsblty: false, putVsblty: false
  })

  const [firstMount, setFirstMount] = React.useState(1);

  React.useEffect(() => {
    if(firstMount > 0) {
      //console.log("Explorer firstMount:", firstMount)
      setFirstMount(firstMount-1);
    }
    else {
      count++;
      console.log("curdir:", explorerState.curDir)
      console.log("curDB:", props.srcDB)
      console.log("Explorer count:", count)
      Axios.post('http://localhost:3001/cmd', {cmd: 'ls', params: [explorerState.curDir]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err)
        }
        else {
          setExplorerState(prevExplorerState => {
            return {
              ...prevExplorerState,
              eList: res.data.content
            }
          })
        }
      });
    }
  }, [explorerState.curDir, props.srcDBFlip]);

  function openMkdirPopup() {
    setCntnrVsblty(prevVsblty => {
      return {
        ...prevVsblty,
        mkdirVsblty: true
      }
    })
  }

  function closeMkdirPopup() {
    setCntnrVsblty(prevVsblty => {
      return {
        ...prevVsblty,
        mkdirVsblty: false
      }
    })
  }

  function openPutPopup() {
    setCntnrVsblty(prevVsblty => {
      return {
        ...prevVsblty,
        putVsblty: true
      }
    })
  }

  function closePutPopup() {
    setCntnrVsblty(prevVsblty => {
      return {
        ...prevVsblty,
        putVsblty: false
      }
    })
  }

  function handleCmdChange(event) {
    setCmdInput(prevInput => {
      return {
        ...prevInput,
        [event.target.name]: event.target.value
      }
    })
  }

  function closeFile() {
    setExplorerState(prevExplorerState => {
      return {
        ...prevExplorerState,
        fileContent: []
      }
    });
  }

  function cdParent() {
    Axios.post('http://localhost:3001/cmd', {cmd: 'cd', params: ['..']}).then((res) => {
      if(res.data.err !== null && res.data.err !== '') {
        alert(res.data.err);
      }
      else {
        setExplorerState(prevExplorerState => {
          return {
            ...prevExplorerState,
            curDir: res.data.content
          }
        });
      }
    });
  }

  function cdChild(event) {
    event.preventDefault();
    if(cmdInput.cdChildDir === '') {
      alert('target directory cannot be empty');
    }
    else {
      Axios.post('http://localhost:3001/cmd', {cmd: 'cd', params: [cmdInput.cdChildDir]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err);
        }
        else {
          setExplorerState(prevExplorerState => {
            return {
              ...prevExplorerState,
              curDir: res.data.content
            }
          });
          setCmdInput({cdChildDir: '', catFile:'', rmTarget:''});
        }
      });
    }
  }

  function cat(event) {
    event.preventDefault();
    if(cmdInput.catFile === '') {
      alert('file name cannot be empty');
    }
    else {
      Axios.post('http://localhost:3001/cmd', {cmd: 'cat', params: [cmdInput.catFile]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err);
        }
        else {
          //console.log(res.data.content)
          setExplorerState(prevExplorerState => {
            return {
              ...prevExplorerState,
              fileContent: res.data.content
            }
          });
          setCmdInput({cdChildDir: '', catFile:'', rmTarget:''});
        }
      });
    }
  }

  function mkdir(event) {
    event.preventDefault();
    if(event.target.name.value === "") {
      alert('please input folder name');
    }
    else {
      closeMkdirPopup();
      document.querySelector('html').classList.toggle('scroll-lock');
      Axios.post('http://localhost:3001/cmd', {cmd: 'mkdir', params: [event.target.name.value]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err);
        }
      }).then(() => {
        Axios.post('http://localhost:3001/cmd', {cmd: 'ls', params: [explorerState.curDir]}).then((res) => {
          if(res.data.err !== null && res.data.err !== '') {
            alert(res.data.err);
          }
          else {
            setExplorerState(prevExplorerState => {
              return {
                ...prevExplorerState,
                eList: res.data.content
              }
            });
          }
        });
      });
    }
  }

  const put = (data) => {
    if(data.file.length === 0) {
      alert('please select a file');
    }
    else if(data.partNum === '') {
      alert('please input number of partitions');
    }
    else {
      closePutPopup();
      document.querySelector('html').classList.toggle('scroll-lock');
      console.log(data)
      fileName = data['file'][0]['name'];
      console.log(fileName)
      numPart = data['partNum'];
      fileReader = new FileReader();
      fileReader.onloadend = handleFileRead;
      fileReader.readAsText(data['file'][0]);
    }
  }

  const handleFileRead = (event) => {
    event.preventDefault(event);
    Axios.post('http://localhost:3001/put', {file: JSON.parse(fileReader.result), name: fileName, numPart: numPart}).then((res) => {
      if(res.data.err !== null && res.data.err !== '') {
        alert(res.data.err);
      }
    }).then(() => {
      Axios.post('http://localhost:3001/cmd', {cmd: 'ls', params: [explorerState.curDir]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err);
        }
        else {
          setExplorerState(prevExplorerState => {
            return {
              ...prevExplorerState,
              eList: res.data.content
            }
          });
        }
      });
    });
  };

  function rm(event) {
    event.preventDefault();
    if(cmdInput.rmTarget === '') {
      alert('file name cannot be empty');
    }
    else {
      Axios.post('http://localhost:3001/cmd', {cmd: 'rm', params: [cmdInput.rmTarget]}).then((res) => {
        if(res.data.err !== null && res.data.err !== '') {
          alert(res.data.err);
        }
      }).then(() => {
        Axios.post('http://localhost:3001/cmd', {cmd: 'ls', params: [explorerState.curDir]}).then((res) => {
          if(res.data.err !== null && res.data.err !== '') {
            alert(res.data.err);
          }
          else {
            setExplorerState(prevExplorerState => {
              return {
                ...prevExplorerState,
                eList: res.data.content
              }
            });
            setCmdInput({cdChildDir: '', catFile:'', rmTarget:''});
          }
        });
      });
    }
  }                         

  return (
      <div className="lvl1Section row">
        <div className="column2">
          {explorerState.curDir !== '/' ? <button className="btn btn-danger center" onClick={cdParent}>Go Back</button> : null}
          <span>&nbsp; &nbsp; &nbsp;</span>
          <Container 
            triggerText='Upload File' 
            onSubmit={put} 
            form={FilePartitionFrom}
            setVisible={openPutPopup}
            setInvisible={closePutPopup}
            visibility={cntnrVsblty.putVsblty}
          />
          <span>&nbsp; &nbsp; &nbsp;</span>
          <Container 
            triggerText='Create Folder' 
            onSubmit={mkdir} 
            form={MkdirForm}
            setVisible={openMkdirPopup}
            setInvisible={closeMkdirPopup}
            visibility={cntnrVsblty.mkdirVsblty}
          />
          <br/>
          <label>Current dir:&nbsp; &nbsp; {explorerState.curDir}</label>
          <br/>
          <label>Content:&nbsp; &nbsp; {explorerState.eList}</label>
          <hr/>
          <br/>
          <form onSubmit={cdChild}>
            <label>Which folder you want to go? &nbsp; &nbsp; &nbsp;</label>
            <input 
              type="text"
              placeholder="target directory"
              onChange={handleCmdChange}
              name="cdChildDir"
              value={cmdInput.cdChildDir}
            />
            <span>&nbsp; &nbsp; &nbsp;</span>
            <button className="btn btn-danger center">Submit</button>
          </form>
          <br/>
          <form onSubmit={cat}>
            <label>Which file you want to open? &nbsp; &nbsp; &nbsp;</label>
            <input 
              type="text"
              placeholder="target file"
              onChange={handleCmdChange}
              name="catFile"
              value={cmdInput.catFile}
            />
            <span>&nbsp; &nbsp; &nbsp;</span>
            <button className="btn btn-danger center">Submit</button>
          </form>
          <br/>
          <form onSubmit={rm}>
            <label>Which file you want to delete? &nbsp; &nbsp; &nbsp;</label>
            <input 
              type="text"
              placeholder="target file"
              onChange={handleCmdChange}
              name="rmTarget"
              value={cmdInput.rmTarget}
            />
            <span>&nbsp; &nbsp; &nbsp;</span>
            <button className="btn btn-danger center">Submit</button>
          </form>
        </div>
        <div className="column2">
          <button className="btn btn-danger center" onClick={closeFile}>Close File</button>
          <span>&nbsp; &nbsp; &nbsp;</span>
          <label>File Content:</label>
          <div className='textbody'>{props.srcDB === 'MySQL' ? explorerState.fileContent : (explorerState.fileContent.length === 0 ? '' : JSON.stringify(explorerState.fileContent))}</div>
        </div>
      </div>
  )
}