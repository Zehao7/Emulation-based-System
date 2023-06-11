import React from 'react';
import { useForm } from 'react-hook-form';

export const MkdirForm = ({ onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input className="form-control" id="name" />
      </div>
      <div className="form-group">
        <button className="form-control btn btn-primary" type="submit">
          Create
        </button>
      </div>
    </form>
  );
};

export const FilePartitionFrom = ({ onSubmit }) => {
  const {register, handleSubmit} = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label htmlFor="partitionnum">Select file:</label>
        <input type="file" name="targetFile" {...register("file")}/>
        <label htmlFor="partitionnum">Number of partitions:</label>
        <input className="form-control" name="partitionnum" {...register("partNum")}/>
      </div>
      <div className="form-group">
        <button className="form-control btn btn-primary" type="submit">
          Upload
        </button>
      </div>
    </form>
  );
};