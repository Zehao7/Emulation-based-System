import React from 'react';
import Axios from 'axios';
import Select from 'react-select';

export default function Query(props) {
  const [studentInput, setStudentInput] = React.useState({
    name: "", hired: undefined, company: "", role: ""
  });

  const [companyInput, setCompanyInput] = React.useState({
    name: "", industry: ""
  });

  const [specInput, setSpecInput] = React.useState({
    min: 0, max: 600
  });

  const [localSpec, setLocalSpec] = React.useState(null);
  const [localFoI, setLocalFoI] = React.useState(['Name', 'SpecName', 'Hired', 'CompName', 'Role']);
  const [localFtC, setLocalFtC] = React.useState(null);
  const [output, setOutput] = React.useState("");

  const specOptions = [
    { value: 'General (28)', label: 'General (28)' },
    { value: 'Software Engineering', label: 'Software Engineering' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
    { value: 'Intelligent Robotics', label: 'Intelligent Robotics' },
    { value: 'Multimedia and Creative Technologies', label: 'Multimedia and Creative Technologies' },
    { value: 'High Performance Computing and Simulation', label: 'High Performance Computing and Simulation' },
    { value: 'Computer Security', label: 'Computer Security' },
    { value: 'Computer Networks', label: 'Computer Networks' },
    { value: 'Scientists and Engineers (37)', label: 'Scientists and Engineers (37)' },
    { value: '', label: '(Any)' }
  ];

  const foiOptions = [
    { value: 'Name', label: 'Name'},
    { value: 'SpecName', label: 'SpecName'},
    { value: 'Hired', label: 'Hired'},
    { value: 'CompanyName', label: 'CompanyName'},
    { value: 'Role', label: 'Role'},
  ];

  const ftcOptions = [
    { value: 'Name', label: 'Name'},
    { value: 'SpecName', label: 'SpecName'},
    { value: 'Hired', label: 'Hired'},
    { value: 'CompanyName', label: 'CompanyName'},
    { value: 'Role', label: 'Role'},
    { value: '', label: '(None)' }
  ];

  let queryEmptyStr = 'no result found'

  function handleSpecChange(event) {
    setLocalSpec(event.value);
    console.log("localSpec", localSpec);
  }

  function handleFtCChange(event) {
    setLocalFtC(event.value);
    console.log("localFtC", localFtC);
  }

  function handleFoIChange(event) {
    let ls = []
    for(let e of event) {
      ls.push(e.value)
    }
    setLocalFoI(ls);
    console.log("localFoI", localFoI);
  }

  function handleStudentChange(event) {
    setStudentInput(pretStudentInput => {
      return {
        ...pretStudentInput,
        [event.target.name]: event.target.value
      }
    });
  }

  function handleCompanyChange(event) {
    setCompanyInput(prevCompanyInput => {
      return {
        ...prevCompanyInput,
        [event.target.name]: event.target.value
      }
    });
  }

  function handleSpecQueryChange(event) {
    setSpecInput(prevSpecInput => {
      return {
        ...prevSpecInput,
        [event.target.name]: event.target.value
      }
    });
  }

  function submitStudentQuery(event) {
    event.preventDefault();
    let jstr = JSON.stringify(
      {
        select: localFoI,
        from: "STUDENT",
        where: [
          {
            attr: "Name",
            value: studentInput.name,
            method: "="
          },
          {
            attr: "SpecName",
            value: localSpec,
            method: "="
          },
          {
            attr: "Hired",
            value: studentInput.hired,
            method: "="
          },
          {
            attr: "CompName",
            value: studentInput.company,
            method: "="
          },
          {
            attr: "Role",
            value: studentInput.role,
            method: "="
          }
        ],
        groupby: localFtC
      }
    )
    Axios.post('http://localhost:3001/query', {rawQuery: jstr}).then((res) => {
      if(res.data.err !== null && res.data.err !== '') {
        alert(res.data.err);
      }
      else {
        if(res.data.output.length === 0) {
          setOutput(queryEmptyStr);
        }
        else {
          setOutput(res.data.output);
        }
      }
    });
  }

  function submitCompanyQuery(event) {
    event.preventDefault();
    let jstr = JSON.stringify(
      {
        select: ["Company", "Industry"],
        from: "COMPANY",
        where: [
          {
            attr: "Company",
            value: companyInput.name,
            method: "="
          },
          {
            attr: "Industry",
            value: companyInput.industry,
            method: "="
          }
        ]
      }
    );
    console.log(jstr)
    Axios.post('http://localhost:3001/query', {rawQuery: jstr}).then((res) => {
      if(res.data.err !== null && res.data.err !== '') {
        alert(res.data.err);
      }
      else {
        if(res.data.output.length === 0) {
          setOutput(queryEmptyStr);
        }
        else {
          setOutput(res.data.output);
        }
      }
    });
  }

  function submitSpecQuery(event) {
    event.preventDefault();
    let jstr = JSON.stringify(
      {
        select: ["Name", "Size"],
        from: "SPEC",
        where: [
          {
            attr: "Size",
            value: specInput.min,
            method: ">="
          },
          {
            attr: "Size",
            value: specInput.max,
            method: "<="
          }
        ]
      }
    );
    console.log(jstr)
    Axios.post('http://localhost:3001/query', {rawQuery: jstr}).then((res) => {
      if(res.data.err !== null && res.data.err !== '') {
        alert(res.data.err);
      }
      else {
        if(res.data.output.length === 0) {
          setOutput(queryEmptyStr);
        }
        else {
          setOutput(res.data.output);
        }
      }
    });
  }

  return (
    <div className="lvl1Section row">
      <div className="column2">
        <form className="lvl2Section row" onSubmit={submitStudentQuery}>
          <h4>Student:</h4>
          <div className="column3">
            <label>Name:</label>
            <br/>
            <input
              type="text"
              name="name"
              onChange={handleStudentChange}
              value={studentInput.name}
            />
            <br/><br/>
            <label>Specification:</label>
            <Select
              name='spec'
              defaultValue={specOptions[10]}
              onChange={handleSpecChange}
              options={specOptions}
            />
            <br/>
            <label>Hired:</label>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <input 
              type="radio" 
              id="hiredTrue" 
              value="True" 
              name="hiredTrue" 
              checked={studentInput.hired === true} 
              onChange={() => {
                setStudentInput(pretStudentInput => {
                  return {
                    ...pretStudentInput,
                    hired: true
                  }
                })
              }}
            />
            <label htmlFor="hiredTrue">True</label>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <input 
              type="radio" 
              id="hiredFalse" 
              value="False" 
              name="hiredFalse" 
              checked={studentInput.hired === false} 
              onChange={() => {
                setStudentInput(pretStudentInput => {
                  return {
                    ...pretStudentInput,
                    hired: false
                  }
                })
              }}
            />
            <label htmlFor="hiredFalse">False</label>
          </div>
          <div className="column3">
            <label>Company:</label>
            <br/>
            <input
              type="text"
              name="company"
              onChange={handleStudentChange}
              value={studentInput.company}
            />
            <br/><br/>
            <label>Field of Interest:</label>
            <br/>
            <Select
              defaultValue={[foiOptions[0], foiOptions[1], foiOptions[2], foiOptions[3], foiOptions[4]]}
              isMulti
              name="foi"
              options={foiOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={handleFoIChange}
            />
          </div>
          <div className="column3">
            <label>Role:</label>
            <br/>
            <input
              type="text"
              name="role"
              onChange={handleStudentChange}
              value={studentInput.role}
            />
            <br/><br/>
            <label>Field to Count:</label>
            <br/>
            <Select
              name='ftc'
              defaultValue={ftcOptions[5]}
              onChange={handleFtCChange}
              options={ftcOptions}
            />
            <br/>
            <button className="btn btn-danger center">Submit</button>
          </div>
        </form>
        <br/>
        <form className="lvl2Section row" onSubmit={submitCompanyQuery}>
          <h4>Company:</h4>
          <div className="column2">
            <label>Name:&nbsp; &nbsp; </label>
            <br/>
            <input
              type="text"
              name="name"
              onChange={handleCompanyChange}
              value={companyInput.name}
              size="30"
            />
            <br/><br/>
            <label>Industry:&nbsp; &nbsp; </label>
            <input
              type="text"
              name="industry"
              onChange={handleCompanyChange}
              value={companyInput.industry}
              size="30"
            />
          </div>
          <div className="column2">
            <button className="btn btn-danger center">Submit</button>
          </div>
        </form>
        <br/>
        <form className="lvl2Section" onSubmit={submitSpecQuery}>
          <h4>Specification:</h4>
          <div className="column2">
            <label>Size:&nbsp; &nbsp; </label>
            <br/>
            <label>min:&nbsp; &nbsp; </label>
            <input
              type="number"
              name="min"
              onChange={handleSpecQueryChange}
              value={specInput.min}
              size="10"
              min="0"
            />
            <label>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </label>
            <label>max:&nbsp; &nbsp; </label>
            <input
              type="number"
              name="max"
              onChange={handleSpecQueryChange}
              value={specInput.max}
              size="10"
              max="600"
            />
          </div>
          <label>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </label>
          <button className="btn btn-danger center">Submit</button>

        </form>
      </div>
      
      <div className="column2">
        <label>query result:</label>
        <div className='textbody'>{props.srcDB === 'MySQL' ? output : (output.length === 0 ? '' : JSON.stringify(output))}</div>
      </div>
    </div>
  )
}